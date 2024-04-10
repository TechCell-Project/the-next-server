import slugify from 'slugify';

/**
 *
 * @param name String name
 * @param timestamp Boolean indicating whether to append a timestamp
 * @returns Slug
 */
export function getSlugFromName(name: string, timestamp: boolean = true) {
    const slug = slugify(name, {
        replacement: '-', // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true, // convert to lower case, defaults to `false`
        strict: false, // strip special characters except replacement, defaults to `false`
        locale: 'vi', // language code of the locale to use
        trim: true,
    });

    return timestamp ? `${slug}-${Date.now()}` : slug;
}
