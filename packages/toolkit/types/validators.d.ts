import type * as api from './api'
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateScript(script: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): script is api.Script;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateOutPoint(outPoint: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): outPoint is api.OutPoint;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateCellInput(cellInput: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): cellInput is api.Input;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateCellOutput(cellOutput: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): cellOutput is api.Output;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateCellDep(cellDep: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): cellDep is api.CellDep;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateRawTransaction(rawTransaction: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): rawTransaction is api.RawTransaction;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateTransaction(transaction: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): transaction is api.Transaction;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateRawHeader(rawHeader: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): rawHeader is Omit<api.Header, 'hash'|'nonce'>;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateHeader(header: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): header is api.Header;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateUncleBlock(uncleBlock: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): uncleBlock is api.UncleBlock;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateBlock(block: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): block is api.Block;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateCellbaseWitness(cellbaseWitness: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): cellbaseWitness is api.CellbaseWitness;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function ValidateWitnessArgs(witnessArgs: any, { nestedValidation, debugPath }?: {
  nestedValidation?: boolean;
  debugPath?: string;
}): witnessArgs is api.WitnessArgs;
