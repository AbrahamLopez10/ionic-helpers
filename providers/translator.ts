/**
 * @name            Translator
 * @description     A simple, efficient i18n (internationalization) service provider for Ionic v2+ apps
 * @author          Abraham Lopez <ablopez824@gmail.com>
 */

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

    getLanguage() {
        return this.language;
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
        let tokenizedStr = vsprintf(str, tokens);
        
        if(!this.bundleStrings[bundle]) return tokenizedStr;
        if(!this.bundleStrings[bundle][this.language]) return tokenizedStr;
        
        let hash = sha1(str);
        let translation = this.bundleStrings[bundle][this.language][hash];

        return translation ? vsprintf(translation, tokens) : tokenizedStr;
    }
}