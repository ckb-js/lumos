import { MolType } from "../type";

type ParseResult = {
  declares: MolType[];
  imports: string[];
  syntaxVersion: string | null;
};

type Grammar = {
  parse(schema: string): ParseResult;
};

declare const grammar: Grammar;

export default grammar;
