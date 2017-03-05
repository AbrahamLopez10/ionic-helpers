import { vsprintf } from './../libs/sprintf';
import { sha1 } from './../libs/sha1';
import { Injectable } from '@angular/core';
import { Translation } from "./translate";

@Injectable()
export class Translator {
    private language: string = 'en';
    private bundleStrings: Object = {};

    constructor() {

    }

    setLanguage(language: string){
        this.language = language;
        return this;
    }

    register(bundle: string, language: string, translation: Translation, override: boolean = false){
        if(!language) language = this.language;
        
        if(!this.bundleStrings[bundle]){
            this.bundleStrings[bundle] = {};
        }

        if(!this.bundleStrings[bundle][language]){
            this.bundleStrings[bundle][language] = {};
        }

        for(let pair of translation){
            let [original, translated] = pair;
            let hash = sha1(original.trim());

            if(!this.bundleStrings[bundle][language][hash] || override){
                this.bundleStrings[bundle][language][hash] = translated;
            }
        }

        return this;
    }

    translate(bundle: string, str: string, tokens: any[] = []): string {
        if(!this.bundleStrings[bundle]) return str;
        if(!this.bundleStrings[bundle][this.language]) return str;
        
        let hash = sha1(str);
        let translation = this.bundleStrings[bundle][this.language][hash];

        return translation ? vsprintf(translation, tokens) : str;
    }
}