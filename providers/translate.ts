/**
 * @name            Translate
 * @description     An easy helper class for easy internationalization of strings in Ionic v2+ apps
 * @author          Abraham Lopez <ablopez824@gmail.com>
 */

import { Translator } from './translator';

export type Translation = Array<string[]>;

export class Translate {
    constructor(
        private translator: Translator,
        private bundle: string = 'default'
    ) {
        if(bundle == 'default' && !window['_T']){
            window['_T'] = (str, ...tokens) => {
                return this.translator.translate(this.bundle, str, tokens);
            };
        }
    }

    register(language: string, translation: Translation) {
        this.translator.register(this.bundle, language, translation);
    }

    _(str, ...tokens): string {
        return this.translator.translate(this.bundle, str, tokens);
    }
}