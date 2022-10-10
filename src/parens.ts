import {
  TextDocument,
  DecorationRangeBehavior,
  ThemeColor,
  TextEditorDecorationType,
  window,
  Range,
  TextEditor,
  workspace,
  TextDocumentChangeEvent,
  OutputChannel,
  Disposable,
  ConfigurationChangeEvent,
} from "vscode";
import { findParens, ParenLocations } from "./parse";
import { debounce, repeat, Debounced } from "./utils";
import {
  DEBOUNCE_CONFIG,
  USE_FLOW_CONFIG,
  PAREN_COLOR_ID,
  SUPPORTED_LANGUAGE_IDS,
} from "./constants";

type ParenLocation = {
  count: number;
  pos: number;
  beforeAfter: "before" | "after";
};

export type ParenStyle = {
  before: string;
  after: string;
};

export default class Parens implements Disposable {
  private readonly _disposables: Disposable[] = [];
  private readonly _decorationType: TextEditorDecorationType;
  private readonly _outputChannel: OutputChannel;
  private _deboucedUpdateDecorations: Debounced<TextEditor>;
  private _parenLocationCache: WeakMap<TextDocument, ParenLocation[]>;
  private _parenStyle: ParenStyle;

  constructor(options: { style?: ParenStyle } = {}) {
    this._parenStyle = options.style || { before: "₍", after: "₎" };
    this._parenLocationCache = new WeakMap();
    this._decorationType = createDecorationType();
    this._deboucedUpdateDecorations = debounce((editor) => {
      this._recomputeParensForEditor(editor, false);
    }, workspace.getConfiguration().get(DEBOUNCE_CONFIG) ?? 500);
    this._outputChannel = window.createOutputChannel("Implicit Parentheses");

    for (const editor of window.visibleTextEditors) {
      this._recomputeParensForEditor(editor);
    }

    this._disposables.push(
      window.onDidChangeVisibleTextEditors(
        this._handleVisibleEditorsChange,
        this
      ),
      workspace.onDidChangeTextDocument(this._handleTextDocumentChange, this),
      workspace.onDidChangeConfiguration(this._handleConfigChange, this)
    );
  }

  _handleConfigChange(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration(DEBOUNCE_CONFIG)) {
      this._deboucedUpdateDecorations.changeDelay(
        workspace.getConfiguration().get(DEBOUNCE_CONFIG) ?? 500
      );
    }
    if (event.affectsConfiguration(USE_FLOW_CONFIG)) {
      this._parenLocationCache = new Map();
      for (const editor of window.visibleTextEditors) {
        this._recomputeParensForEditor(editor);
      }
    }
  }

  // When a text document changes, if it's active, recompute its parens.
  _handleTextDocumentChange(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    if (
      activeEditor !== undefined &&
      event.document === activeEditor.document
    ) {
      this._deboucedUpdateDecorations(activeEditor);
    } else {
      // I don't know how to get the text editor for this document, so the best
      // we can do is invalidate our cached value.
      this._parenLocationCache.delete(event.document);
    }
  }

  // When the set of visible editors change, recompute all visible editors.
  // We use cached values where possible to reduce the time between when the
  // editor is visible and when the decorations are applied.
  // This is extra imporant becuase I believe VS Code strips decorations when
  // the editor becomes hidden.
  _handleVisibleEditorsChange(editors: TextEditor[]) {
    editors.forEach((editor) => {
      this._recomputeParensForEditor(editor, true);
    });
  }

  _recomputeParensForEditor(editor: TextEditor, useCache: boolean = false) {
    const maybeCachedParens = useCache
      ? this._parenLocationCache.get(editor.document)
      : undefined;

    const parenLocations = maybeCachedParens ?? this._getParenLocations(editor);

    if (parenLocations !== undefined) {
      this._applyParensToEditor(editor, parenLocations);
    }
  }

  // Compute the locations of parens to insert. If the file is not a file type
  // we can parse, or is malformed, return `undefined` meaning "Don't update".
  // Otherwise caches and returns an array or paren locations.
  _getParenLocations(editor: TextEditor): ParenLocation[] | undefined {
    const { languageId } = editor.document;
    if (!SUPPORTED_LANGUAGE_IDS.has(languageId)) {
      // Maybe this file used to be JS, but is not any more.
      if (this._parenLocationCache.has(editor.document)) {
        this._parenLocationCache.delete(editor.document);
        return []; // Return empty array so that we clear any existing decorations.
      }
      return;
    }
    const useFlow: boolean =
      workspace.getConfiguration().get(USE_FLOW_CONFIG) ?? false;

    let parens: ParenLocations;
    try {
      parens = findParens(
        editor.document.getText(),
        editor.document.languageId,
        useFlow
      );
    } catch (e) {
      this._outputChannel.appendLine(
        `Encounterd an error parsing ${editor.document.fileName}: ${String(e)}`
      );
      // If the file is malformed, we don't want to clear the parens, so we
      // return undefined rather than empty array.
      return;
    }

    const { open, close } = parens;

    const decorations: ParenLocation[] = [];

    open.forEach((count, pos) => {
      decorations.push({ count, pos, beforeAfter: "before" });
    });

    close.forEach((count, pos) => {
      decorations.push({ count, pos, beforeAfter: "after" });
    });

    this._parenLocationCache.set(editor.document, decorations);

    return decorations;
  }

  _applyParensToEditor(editor: TextEditor, parenLocations: ParenLocation[]) {
    editor.setDecorations(
      this._decorationType,
      parenLocations.map(({ count, pos, beforeAfter }) => ({
        range: new Range(
          editor.document.positionAt(pos),
          editor.document.positionAt(pos)
        ),
        renderOptions: {
          [beforeAfter]: {
            contentText: repeat(this._parenStyle[beforeAfter], count),
          },
        },
      }))
    );
  }

  dispose() {
    this._deboucedUpdateDecorations.dispose();
    this._decorationType.dispose();
    this._outputChannel.dispose();
    this._disposables.forEach((disposable) => disposable.dispose());
  }
}

function createDecorationType(): TextEditorDecorationType {
  // Note: VS Code takes care of updating this color for us if the config changes.
  const parenColor = new ThemeColor(PAREN_COLOR_ID);
  return window.createTextEditorDecorationType({
    after: {
      color: parenColor,
      fontStyle: "normal",
    },
    before: {
      color: parenColor,
      fontStyle: "normal",
    },
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  });
}
