package fontAwesome

// Codes
//
// English:
//
//	fontAwesomeIcon holds a human-readable name and the Font Awesome
//	icon identifier used by Node-RED ("font-awesome/fa-...").
//
// Português:
//
//	fontAwesomeIcon guarda um nome legível e o identificador
//	do ícone Font Awesome usado pelo Node-RED ("font-awesome/fa-...").
type Codes struct {
	Name string
	Code string
}

type Icons struct {
	// List
	//
	// English:
	//
	//	nodeRedFontAwesomeIcons is a curated list of 100 common Font Awesome
	//	icons that work well for Node-RED nodes, UIs and status indicators.
	//
	// Portuguese:
	//
	//	nodeRedFontAwesomeIcons é uma lista selecionada com 100 ícones
	//	comuns do Font Awesome que funcionam bem em nós do Node-RED,
	//	telas de configuração e indicadores de estado.
	List []Codes
}

func (e *Icons) Init() {
	e.List = []Codes{
		{Name: "search", Code: "font-awesome/fa-search"},
		{Name: "envelope", Code: "font-awesome/fa-envelope"},
		{Name: "envelope-o", Code: "font-awesome/fa-envelope-o"},
		{Name: "heart", Code: "font-awesome/fa-heart"},
		{Name: "star", Code: "font-awesome/fa-star"},
		{Name: "star-o", Code: "font-awesome/fa-star-o"},
		{Name: "user", Code: "font-awesome/fa-user"},
		{Name: "users", Code: "font-awesome/fa-users"},
		{Name: "th-large", Code: "font-awesome/fa-th-large"},
		{Name: "th", Code: "font-awesome/fa-th"},
		{Name: "th-list", Code: "font-awesome/fa-th-list"},
		{Name: "check", Code: "font-awesome/fa-check"},
		{Name: "times", Code: "font-awesome/fa-times"},
		{Name: "search-plus", Code: "font-awesome/fa-search-plus"},
		{Name: "search-minus", Code: "font-awesome/fa-search-minus"},
		{Name: "power-off", Code: "font-awesome/fa-power-off"},
		{Name: "signal", Code: "font-awesome/fa-signal"},
		{Name: "cog", Code: "font-awesome/fa-cog"},
		{Name: "cogs", Code: "font-awesome/fa-cogs"},
		{Name: "home", Code: "font-awesome/fa-home"},
		{Name: "file-o", Code: "font-awesome/fa-file-o"},
		{Name: "clock-o", Code: "font-awesome/fa-clock-o"},
		{Name: "download", Code: "font-awesome/fa-download"},
		{Name: "upload", Code: "font-awesome/fa-upload"},
		{Name: "inbox", Code: "font-awesome/fa-inbox"},
		{Name: "play-circle-o", Code: "font-awesome/fa-play-circle-o"},
		{Name: "repeat", Code: "font-awesome/fa-repeat"},
		{Name: "refresh", Code: "font-awesome/fa-refresh"},
		{Name: "list-alt", Code: "font-awesome/fa-list-alt"},
		{Name: "lock", Code: "font-awesome/fa-lock"},
		{Name: "flag", Code: "font-awesome/fa-flag"},
		{Name: "headphones", Code: "font-awesome/fa-headphones"},
		{Name: "volume-off", Code: "font-awesome/fa-volume-off"},
		{Name: "volume-down", Code: "font-awesome/fa-volume-down"},
		{Name: "volume-up", Code: "font-awesome/fa-volume-up"},
		{Name: "qrcode", Code: "font-awesome/fa-qrcode"},
		{Name: "barcode", Code: "font-awesome/fa-barcode"},
		{Name: "tag", Code: "font-awesome/fa-tag"},
		{Name: "tags", Code: "font-awesome/fa-tags"},
		{Name: "book", Code: "font-awesome/fa-book"},
		{Name: "bookmark", Code: "font-awesome/fa-bookmark"},
		{Name: "print", Code: "font-awesome/fa-print"},
		{Name: "camera", Code: "font-awesome/fa-camera"},
		{Name: "font", Code: "font-awesome/fa-font"},
		{Name: "bold", Code: "font-awesome/fa-bold"},
		{Name: "italic", Code: "font-awesome/fa-italic"},
		{Name: "align-left", Code: "font-awesome/fa-align-left"},
		{Name: "align-center", Code: "font-awesome/fa-align-center"},
		{Name: "align-right", Code: "font-awesome/fa-align-right"},
		{Name: "align-justify", Code: "font-awesome/fa-align-justify"},
		{Name: "list", Code: "font-awesome/fa-list"},
		{Name: "outdent", Code: "font-awesome/fa-outdent"},
		{Name: "indent", Code: "font-awesome/fa-indent"},
		{Name: "video-camera", Code: "font-awesome/fa-video-camera"},
		{Name: "picture-o", Code: "font-awesome/fa-picture-o"},
		{Name: "pencil", Code: "font-awesome/fa-pencil"},
		{Name: "pencil-square-o", Code: "font-awesome/fa-pencil-square-o"},
		{Name: "map-marker", Code: "font-awesome/fa-map-marker"},
		{Name: "adjust", Code: "font-awesome/fa-adjust"},
		{Name: "tint", Code: "font-awesome/fa-tint"},
		{Name: "pencil-square", Code: "font-awesome/fa-pencil-square"},
		{Name: "share-square-o", Code: "font-awesome/fa-share-square-o"},
		{Name: "check-square-o", Code: "font-awesome/fa-check-square-o"},
		{Name: "arrows", Code: "font-awesome/fa-arrows"},
		{Name: "step-backward", Code: "font-awesome/fa-step-backward"},
		{Name: "fast-backward", Code: "font-awesome/fa-fast-backward"},
		{Name: "backward", Code: "font-awesome/fa-backward"},
		{Name: "play", Code: "font-awesome/fa-play"},
		{Name: "pause", Code: "font-awesome/fa-pause"},
		{Name: "stop", Code: "font-awesome/fa-stop"},
		{Name: "forward", Code: "font-awesome/fa-forward"},
		{Name: "fast-forward", Code: "font-awesome/fa-fast-forward"},
		{Name: "step-forward", Code: "font-awesome/fa-step-forward"},
		{Name: "eject", Code: "font-awesome/fa-eject"},
		{Name: "chevron-left", Code: "font-awesome/fa-chevron-left"},
		{Name: "chevron-right", Code: "font-awesome/fa-chevron-right"},
		{Name: "plus-circle", Code: "font-awesome/fa-plus-circle"},
		{Name: "minus-circle", Code: "font-awesome/fa-minus-circle"},
		{Name: "times-circle", Code: "font-awesome/fa-times-circle"},
		{Name: "check-circle", Code: "font-awesome/fa-check-circle"},
		{Name: "question-circle", Code: "font-awesome/fa-question-circle"},
		{Name: "info-circle", Code: "font-awesome/fa-info-circle"},
		{Name: "crosshairs", Code: "font-awesome/fa-crosshairs"},
		{Name: "times-circle-o", Code: "font-awesome/fa-times-circle-o"},
		{Name: "check-circle-o", Code: "font-awesome/fa-check-circle-o"},
		{Name: "ban", Code: "font-awesome/fa-ban"},
		{Name: "arrow-left", Code: "font-awesome/fa-arrow-left"},
		{Name: "arrow-right", Code: "font-awesome/fa-arrow-right"},
		{Name: "arrow-up", Code: "font-awesome/fa-arrow-up"},
		{Name: "arrow-down", Code: "font-awesome/fa-arrow-down"},
		{Name: "share", Code: "font-awesome/fa-share"},
		{Name: "expand", Code: "font-awesome/fa-expand"},
		{Name: "compress", Code: "font-awesome/fa-compress"},
		{Name: "plus", Code: "font-awesome/fa-plus"},
		{Name: "minus", Code: "font-awesome/fa-minus"},
		{Name: "asterisk", Code: "font-awesome/fa-asterisk"},
		{Name: "exclamation-circle", Code: "font-awesome/fa-exclamation-circle"},
		{Name: "exclamation-triangle", Code: "font-awesome/fa-exclamation-triangle"},
		{Name: "question", Code: "font-awesome/fa-question"},
		{Name: "info", Code: "font-awesome/fa-info"},
	}
}
