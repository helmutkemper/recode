package terminal

import "github.com/rivo/tview"

func (e *App) Init() {
	e.bookRules.Init()

	// Create the tview application.
	// Cria a aplicação tview.
	e.app = tview.NewApplication()

	// Create the pages manager and register the "main" page with the layout.
	// Cria o gerenciador de páginas e registra a página "main" com o layout.
	e.pages = tview.NewPages()

	// Build the pages container with the first page.
	// Monta o container de páginas com a primeira página.
	e.buildMainPage()
	e.createNodePage()
	e.addNewConnectionPage()

	// Configure global keyboard shortcuts (e.g. ESC and Ctrl+C to exit).
	// Configura atalhos globais de teclado (ex.: ESC e Ctrl+C para sair).
	e.configureGlobalKeys()

	e.show()
}
