package terminal

import "github.com/rivo/tview"

// setPageRegister Registra os elementos da página que podem receber o foco no ctrl+espaço
//
//	Entradas:
//	  page: nome da página
//	  primitive: lista de elementos tview na ordem de troca do foco
func (e *App) setPageRegister(page string, primitive ...tview.Primitive) {
	if e.focusRegister == nil {
		e.focusRegister = make(map[pageName]focus)
	}

	e.currentPage = pageName(page)

	e.focusRegister[pageName(page)] = focus{
		change: primitive,
	}
}
