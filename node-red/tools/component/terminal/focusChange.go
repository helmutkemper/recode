package terminal

func (e *App) focusChange() {
	change := e.focusRegister[e.currentPage].change

	e.focus.index += 1
	if e.focus.index >= len(change) {
		e.focus.index = 0
	}

	e.app.SetFocus(change[e.focus.index])
}
