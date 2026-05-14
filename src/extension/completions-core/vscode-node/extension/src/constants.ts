/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Commands ending with "Client" refer to the command ID used in the legacy Copilot extension.
// - These IDs should not appear in the package.json file
// - These IDs should be registered to support all functionality (except if this command needs to be supported when both extensions are loaded/active).
// Commands ending with "Chat" refer to the command ID used in the Copilot Chat extension.
// - These IDs should be used in package.json
// - These IDs should only be registered if they appear in the package.json (meaning the command palette) or if the command needs to be supported when both extensions are loaded/active.

export const CMDOpenPanelClient = 'electivus.copilot.generate';
export const CMDOpenPanelChat = 'electivus.copilot.chat.openSuggestionsPanel'; // "electivus.copilot.chat.generate" is already being used

export const CMDAcceptCursorPanelSolutionClient = 'electivus.copilot.acceptCursorPanelSolution';
export const CMDNavigatePreviousPanelSolutionClient = 'electivus.copilot.previousPanelSolution';
export const CMDNavigateNextPanelSolutionClient = 'electivus.copilot.nextPanelSolution';

export const CMDToggleStatusMenuClient = 'electivus.copilot.toggleStatusMenu';
export const CMDToggleStatusMenuChat = 'electivus.copilot.chat.toggleStatusMenu';

// Needs to be supported in both extensions when they are loaded/active. Requires a different ID.
export const CMDSendCompletionsFeedbackChat = 'electivus.copilot.chat.sendCompletionFeedback';

export const CMDEnableCompletionsChat = 'electivus.copilot.chat.completions.enable';
export const CMDDisableCompletionsChat = 'electivus.copilot.chat.completions.disable';
export const CMDToggleCompletionsChat = 'electivus.copilot.chat.completions.toggle';
export const CMDEnableCompletionsClient = 'electivus.copilot.completions.enable';
export const CMDDisableCompletionsClient = 'electivus.copilot.completions.disable';
export const CMDToggleCompletionsClient = 'electivus.copilot.completions.toggle';

export const CMDOpenLogsClient = 'electivus.copilot.openLogs';
export const CMDOpenDocumentationClient = 'electivus.copilot.openDocs';

// Existing chat command reused for diagnostics
export const CMDCollectDiagnosticsChat = 'electivus.copilot.debug.collectDiagnostics';

// Context variable that enable/disable panel-specific commands
export const CopilotPanelVisible = 'electivus.copilot.panelVisible';
export const ComparisonPanelVisible = 'electivus.copilot.comparisonPanelVisible';
export const HasMultipleCompletionModels = 'electivus.copilot.completions.hasMultipleModels';

export const CMDOpenModelPickerClient = 'electivus.copilot.openModelPicker';
export const CMDOpenModelPickerChat = 'electivus.copilot.chat.openModelPicker';