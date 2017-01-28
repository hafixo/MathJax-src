/*************************************************************
 *
 *  Copyright (c) 2015-2017 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


/**
 * @fileoverview Symbol map classes.
 *
 * @author v.sorge@mathjax.org (Volker Sorge)
 */

/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="symbol.ts"/>
/// <reference path="parse_methods.ts"/>

import {Symbol, Macro, Args} from './symbol';
import {someTest} from './parse_methods';

//// TODO: This is temporary, until we have got rid of the Array/boolean return
//// values!
export type LookupReturn = string | Array<string|boolean|JSON> | boolean;

/**
 * SymbolMaps are the base components for the input parsers.
 * 
 * They provide a contains method that checks if a map is applicable (contains)
 * a particular string. Implementing classes then perform the actual symbol
 * parsing, from simple regular expression test, straight forward symbol mapping
 * to transformational functionality on the parsed string.
 * 
 * @interface
 */
export interface SymbolMap {
  
  /**
   * @return {string} The name of the map.
   */
  getName(): string;

  /**
   * @param {string} symbol
   * @return {boolean} 
   */
  contains(symbol: string): boolean;

}


export abstract class AbstractSymbolMap<T> implements SymbolMap {

  private name: string;
  
  constructor(name: string) {
    this.name = name;
  };

  /**
   * @override
   */
  public getName(): string {
    return this.name;
  }

  /**
   * @override
   */
  public abstract contains(symbol: string): boolean;


  /**
   * @param {string} symbol
   * @return {T} 
   */
  public abstract lookup(symbol: string): T;

}


export class RegExpMap extends AbstractSymbolMap<boolean> {

  private regExp: RegExp;
  
  constructor(name: string, regExp: RegExp) {
    super(name);
    this.regExp = regExp;
  };

  /**
   * @override
   */
  public contains(symbol: string) {
    return this.lookup(symbol);
  }
  
  /**
   * @override
   */
  public lookup(symbol: string) {
    return this.regExp.test(symbol);
  }
  
}


export abstract class AbstractParseMap<K> extends AbstractSymbolMap<K> {

  private map: Map<string, K> = new Map<string, K>();

  /**
   * @override
   */
  public lookup(symbol: string) {
    return this.map.get(symbol);
  }

  /**
   * @override
   */
  public contains(symbol: string) {
    return this.map.has(symbol);
  }
  
  /**
   * 
   * @param {string} symbol
   * @param {T} object
   */
  protected add(symbol: string, object: K) {
    this.map.set(symbol, object);
  }

  /**
   * Adds the a new element to the map.
   * @param {string} symbol
   * @param {JSON} object Element given in MathJax's configuration format.
   */
  public abstract addElement<K>(symbol: string, object: K): void;

}


export class CharacterMap extends AbstractParseMap<Symbol> {

  public addElement(symbol: string, object: [string, null] | [string, Record<string, Args>]): void {
    let character = new Symbol(symbol, object[0], object[1]);
    this.add(symbol, character);
  }

  // TODO: Some of this is due to the legacy code format.  In particular working
  //       with nullable Attributes should not be necessary!
  public static create(name: string,
                       json: {[index: string]: string|[string, Record<string, Args>]}): CharacterMap {
    let map = new CharacterMap(name);
    for (let key in json) {
      let value = json[key];
      map.addElement(key, (typeof(value) === "string") ? [value, null] : value);
    }
    return map;
  }
  
}


export class MacroMap extends AbstractParseMap<Macro> {

  public addElement(symbol: string, object: Args[]): void {
    let character = new Macro(symbol, <string> object[0], object.slice(1));
    this.add(symbol, character);
  }

  // TODO: Some of this is due to the legacy code format.
  public static create(name: string,
                       json: {[index: string]: string|Args[]}): MacroMap {
    let map = new MacroMap(name);
    for (let key in json) {
      let value = json[key];
      map.addElement(key, (typeof(value) === "string") ? [value] : value);
    }
    return map;
  }
  
}

