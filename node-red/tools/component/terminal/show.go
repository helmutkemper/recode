package terminal

import "log"

func (e *App) show() {
	e.sendToFront("main")

	// Set the pages as the root primitive and run the application.
	// Define as páginas como elemento raiz e executa a aplicação.
	if err := e.app.SetRoot(e.pages, true).EnableMouse(true).Run(); err != nil {
		log.Fatalf("error starting tview application: %v", err)
	}
}
