export function truncateDescription(desc, maxLen = 80) {
    if (desc.length <= maxLen)
        return desc;
    return desc.slice(0, maxLen - 3) + '...';
}
//# sourceMappingURL=truncate-description.js.map