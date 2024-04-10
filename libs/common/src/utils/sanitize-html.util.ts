import * as sanitizeHtml from 'sanitize-html';

/**
 *
 * @param html Sanitize html string
 * @returns A string after sanitize
 */
export function sanitizeHtmlString(html = ''): string {
    const result = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: { img: ['src', 'alt', 'width', 'height'] },
        allowedSchemes: ['data', 'http', 'https'],
    });
    return result;
}
