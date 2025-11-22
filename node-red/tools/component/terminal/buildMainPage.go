package terminal

import "github.com/rivo/tview"

// buildMainPage
//
// English:
//
//	Creates the main page structure using tview.Pages.
//	The main page is a Flex laid out in columns:
//	  * Left column: a List to act as a simple menu.
//	  * Right column: an empty Box (only border), reserved for future content.
//
//	The function returns a *tview.Pages already containing the "main"
//	page, visible and resized with the terminal.
//
// Português:
//
//	Cria a estrutura da página principal usando tview.Pages.
//	A página principal é um Flex em colunas:
//	  * Coluna da esquerda: uma List para servir como menu simples.
//	  * Coluna da direita: uma Box vazia (apenas borda), reservada
//	    para conteúdo futuro.
//
//	A função retorna um *tview.Pages já contendo a página "main",
//	visível e com redimensionamento junto ao terminal.
func (e *App) buildMainPage() {
	// Create the list that will appear on the left side.
	// Cria a lista que ficará do lado esquerdo.
	menuList := tview.NewList()
	menuList.
		SetBorder(true).   // Draw a border around the list. / Desenha uma borda ao redor da lista.
		SetTitle(" Menu ") // Title of the list box. / Título da caixa da lista.

	// Add some example items to the list.
	// Adiciona alguns itens de exemplo na lista.
	menuList.AddItem("Node", "Create node", 'n', func() {
		e.sendToFront("createNode")
	})
	menuList.AddItem("Quit", "Press to exit", 'q', func() {
		e.app.Stop()
	})

	// Create the text view for the right side.
	// Cria o TextView para o lado direito.
	rightPlaceholder := tview.NewTextView()
	rightPlaceholder.
		SetText("\n" +
			"Para navegar entre as telas, use:" +
			"\n" +
			"\n" +
			"[yellow]ctrl+espaço[-]:\tAlterna entre a área esquerda e direita da tela;" +
			"\n" +
			"[yellow]tab[-]:\t\t\tNavega entre os componentes do formulário;" +
			"\n" +
			"[yellow]espaço[-]:\t\t\tAperta o botão do formulário, quando no foco." +
			"\n" +
			"[yellow]ctrl+C[-]:\t\t\tFecha o programa sem salvar (em qualquer tela).",
		).
		SetDynamicColors(true).
		SetBorder(false)

	// rightWrapper
	//
	// English:
	//	rightWrapper creates margins around the TextView on the right side,
	//	so the text box appears more centered inside its area.
	//	We use a vertical Flex (rows) and, in the middle row, a horizontal
	//	Flex (columns) with Box spacers as left/right margins.
	//	The Box spacers repaint the background and avoid showing content
	//	from pages underneath.
	//
	// Português:
	//	rightWrapper cria margens ao redor do TextView no lado direito,
	//	fazendo a caixa de texto aparecer mais ao centro da área dela.
	//	Usamos um Flex vertical (linhas) e, na linha do meio, um Flex
	//	horizontal (colunas) com caixas (Box) como margens esquerda/direita.
	//	Essas caixas repintam o fundo e evitam que o conteúdo de páginas
	//	abaixo fique visível.
	rightWrapper := tview.NewFlex().
		SetDirection(tview.FlexRow)

	// Middle row: a horizontal flex with left/right margins.
	// Linha do meio: um flex horizontal com margens esquerda/direita.
	centerRow := tview.NewFlex().
		SetDirection(tview.FlexColumn)

	// Add left margin using an empty Box (fills background).
	// Adiciona margem esquerda usando uma Box vazia (preenche o fundo).
	centerRow.AddItem(tview.NewBox(), 4, 0, false)   // 4 colunas de margem à esquerda.
	centerRow.AddItem(rightPlaceholder, 0, 1, false) // TextView ocupa o espaço flexível.
	centerRow.AddItem(tview.NewBox(), 4, 0, false)   // 4 colunas de margem à direita.

	// Add top margin, center row, and bottom margin using Box spacers.
	// Adiciona margem superior, linha central e margem inferior usando Box.
	rightWrapper.
		AddItem(tview.NewBox(), 1, 0, false). // 1 linha de margem em cima.
		AddItem(centerRow, 0, 1, false).      // Linha central ocupa o restante.
		AddItem(tview.NewBox(), 1, 0, false). // 1 linha de margem embaixo.
		SetBorder(true)

	// Create a Flex in column mode (left and right areas).
	// Cria um Flex no modo colunas (área esquerda e direita).
	layout := tview.NewFlex().
		SetDirection(tview.FlexColumn)

	// Add the left list with a fixed width, and the right wrapper taking the rest.
	// Adiciona a lista da esquerda com largura fixa e o wrapper da direita ocupando o restante.
	layout.
		AddItem(menuList, 25, 1, true). // 25 columns fixed for the menu. / 25 colunas fixas para o menu.
		AddItem(rightWrapper, 0, 3, false)

	e.pages.AddPage("main", layout, true, true)
	e.setPageRegister("main", menuList, rightPlaceholder)
}
