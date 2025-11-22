package terminal

import "github.com/gdamore/tcell/v2"

// configureGlobalKeys
//
// English:
//
//	Configures global keyboard shortcuts for the tview application.
//	Currently it defines ESC and Ctrl+C to stop the application.
//
// Português:
//
//	Configura atalhos globais de teclado para a aplicação tview.
//	Atualmente define ESC e Ctrl+C para parar a aplicação.
func (e *App) configureGlobalKeys() {
	e.app.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		switch event.Key() {
		case tcell.KeyCtrlSpace:
			e.focusChange()
			return nil

		case /*tcell.KeyEscape,*/ tcell.KeyCtrlC:
			// Stop the application when ESC or Ctrl+C is pressed.
			// Para a aplicação quando ESC ou Ctrl+C for pressionado.
			e.app.Stop()
			return nil
		default:
			return event
		}
	})
}
