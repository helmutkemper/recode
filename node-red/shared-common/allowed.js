function allowed(list, value) {
    return Array.isArray(list) && list.includes(value);
}
module.exports = { allowed };
