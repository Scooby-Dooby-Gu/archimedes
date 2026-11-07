import inflection from 'inflection';

const tokenCache = {};
function cleanToken(word) {
    return tokenCache[word] || (tokenCache[word] = inflection.singularize(word.toLowerCase().trim()))
}

const punctuactionRegexp = /[\s|!+&^+.,;?/\\()\[\]_%]+/

function prepareGlossary(glossary) {
    const terms = {};
    for (var term in glossary) {
        term.toLowerCase().split(/\s*\/\s*/g).map((termBit) => {
            const cleanBit = termBit.match(/([$\s|!+&^+.,;?/\\()\[\]_%]+)|([^$\s|!+&^+.,;?/\\()\[\]_%]+)/g).map((word) => {
                return word.match(punctuactionRegexp) ? ' ' : cleanToken(word);
            }).join('')
            terms[cleanBit] = glossary[term][0].canonical;
        })
    }
    return terms;
}


function consumeTokens(tokens, currentIndex, length, glossary, instances) {
    if (tokens.length < currentIndex + length) return;
    
    const buffer = tokens.slice(currentIndex, currentIndex + length);
    const word = buffer.filter((w) => !w.match(/^\s+$/)).map(cleanToken).join(' ');
    if (glossary[word] && !instances.includes(glossary[word])) {
        instances.push(glossary[word]);
        return {
            text: buffer.join(''),
            term: glossary[word],
            length: length,
        }
    }
}

const ignoreTags = ['MARK', 'A', 'H1', 'H2', 'H3', 'FIGCAPTION'];

function markNode (node, glossary, instances) {
    if (node.nodeType == 1 
        && !ignoreTags.includes(node.tagName) && 
        !node.className.includes('question') && 
        node.getAttribute('type') != 'eureka' && 
        !node.className.includes('image-style-block-align-') && 
        !node.className.includes('with-url')) {
        const children = Array.prototype.slice.call(node.childNodes);
        for (var i = 0; i < children.length; i++) {
            markNode(children[i], glossary, instances)
        }
    } else if (node.nodeType == 3) {
        var tokens = node.textContent.match(/([\w-]+)|(\W+)/g) || [];
        var result = [];
        for (var i = 0; i < tokens.length; i++) {
            if (!tokens[i].match(punctuactionRegexp)) {
                var highlight = consumeTokens(tokens, i, 7, glossary, instances) ||
                                consumeTokens(tokens, i, 5, glossary, instances) ||
                                consumeTokens(tokens, i, 3, glossary, instances) ||
                                consumeTokens(tokens, i, 1, glossary, instances);
                if (highlight) {
                    i += highlight.length - 1;
                    result.push(highlight);
                    continue;
                }
            }
            
            if (typeof result[result.length - 1] == 'string')
                result[result.length - 1] += tokens[i];
            else
                result.push(tokens[i])
        }
        if (result.length > 1 || result.length == 1 && typeof result[0] != 'string') {
            for (var i = 0; i < result.length; i++ ) {
                if (typeof result[i] == 'string') {
                    const textNode = document.createTextNode(result[i]);
                    node.parentNode.insertBefore(textNode, node);
                } else {
                    const markNode = document.createElement('mark');
                    markNode.setAttribute('term', result[i].term);
                    markNode.textContent = result[i].text;
                    node.parentNode.insertBefore(markNode, node);
                }
            }
            node.parentNode.removeChild(node)
        }
    }

}
export function markHTML(html, glossary, instances = []) {
    const div = document.createElement('div');
    div.innerHTML = html;
    mark(div, glossary, instances);
    return div.innerHTML;
}

export default function mark(node, glossary, instances = []) {
    return markNode(node, prepareGlossary(glossary), instances);
}
