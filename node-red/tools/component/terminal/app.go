package terminal

import (
	"_util/ruleBook"

	"github.com/rivo/tview"
)

type App struct {
	app           *tview.Application
	pages         *tview.Pages
	focus         focus
	focusRegister map[pageName]focus
	currentPage   pageName

	bookRules ruleBook.Rules
}
