type stringable = { toString: () => string }
export type Attributes = Record<string, Attribute>
export type AttributeValue = stringable
export type AttributeKV = [string, AttributeValue]
export type Attribute = AttributeKV | AttributeValue
export type Tag = {
  name: string
  attributes?: Attributes
  children?: Tag[]
}
  
const attributesToString = (a: Attributes) => Object.entries(a).map(([k, v]) => Array.isArray(v) && v.length === 2 ? `${v[0]}="${v[1]}"` : `${k}="${v}"`).join(' ')
const selfClose = (e: Tag) => e.children === undefined ? '/' : ''
const closeTag = (e: Tag) => e.children !== undefined ? `</${e.name}>` : ''
export const tagToString = (e: Tag): string => `<${[e.name, e.attributes && attributesToString(e.attributes), selfClose(e)].filter(s => s).join(' ')}>${e.children?.map(c => tagToString(c)).join('') || ''}${closeTag(e)}`
