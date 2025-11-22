package ruleBook

import "regexp"

func (e *Rules) Init() {
	e.RegexName = regexp.MustCompile("^([a-z][a-z0-9_]*)$")
}
