package terminal

func (e *App) sendToFront(page string) {
	e.currentPage = pageName(page)
	e.pages.SendToFront(page)
}
