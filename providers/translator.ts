import { vsprintf } from './../libs/sprintf';
import { sha1 } from './../libs/sha1';
import { Injectable } from '@angular/core';

@Injectable()
export class Translator {
    private language: string = 'en';
    private bundleStrings: Object = {};

    constructor() {

    }

    setLanguage(language: string){
        this.language = language;
    }

    register(bundle: string, language: string, strings: Array<string[]>){
        if(!this.bundleStrings[bundle]){
            this.bundleStrings[bundle] = {};
        }

        if(!this.bundleStrings[bundle][language]){
            this.bundleStrings[bundle][language] = {};
        }

        for(let pair of strings){
            let [original, translated] = pair;
            let hash = sha1(original.trim());
            this.bundleStrings[bundle][language][hash] = translated;
        }
    }

    translate(bundle: string, str: string, tokens: any[]): string {
        let hash = sha1(str);
        let translation = this.bundleStrings[bundle][this.language][hash];

        return translation ? vsprintf(translation, tokens) : str;
    }
}