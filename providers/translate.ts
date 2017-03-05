import { Translator } from './translator';

export type Translation = Array<string[]>;

export class Translate {
    constructor(
        private translator: Translator,
        private bundle: string
    ) {

    }

    register(language: string, translation: Translation) {
        this.translator.register(this.bundle, language, translation);
    }

    _(str, ...tokens): string {
        return this.translator.translate(this.bundle, str, tokens);
    } 
}