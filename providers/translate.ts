import { Translator } from './translator';

export class Translate {
    private bundle: string;

    constructor(
        private translator: Translator
    ) {

    }

    init(bundle: string) {
        this.bundle = bundle;
        return this;
    }

    register(language: string, translation: Array<string[]>) {
        this.translator.register(this.bundle, language, translation);
    }

    _(str, ...tokens): string {
        return this.translator.translate(this.bundle, str, tokens);
    } 
}