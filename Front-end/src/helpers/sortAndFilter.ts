export function sortAscending<T>(arr: T[], field: keyof T) {
  return arr.sort((a: T, b: T) => {
    if (a[field] > b[field]) {
      return 1;
    }
    if (b[field] > a[field]) {
      return -1;
    }
    return 0;
  });
}

export function sortDescending<T>(arr: T[], field: keyof T) {
  return arr.sort((a: T, b: T) => {
    if (a[field] > b[field]) {
      return -1;
    }
    if (b[field] > a[field]) {
      return 1;
    }
    return 0;
  });
}

export function filter<T>(
  arr: T[],
  field: keyof T,
  value: string | number | boolean
) {
  if (field != null) {
    return arr.filter((item) => {
      return item[field] === value;
    });
  }
}

export function filterGetAllExcept<T>(
  arr: T[],
  field: keyof T,
  value: string | number | boolean
) {
  if (field != null) {
    return arr.filter((item) => {
      return item[field] !== value;
    });
  }
}

export function groupBy<T>(arr: T[], field: keyof T) {
  return arr.reduce<{ [key: string]: T[] }>(
    (result, item) => ({
      ...result,
      [item[field] as string]: [...(result[item[field] as string] || []), item],
    }),
    {}
  );
}

export function max<T>(arr: T[], field: keyof T) {
  if (arr.length === 0) return undefined;

  return arr.reduce((maxItem, currentItem) => {
    return currentItem[field] > maxItem[field] ? currentItem : maxItem;
  });
}
