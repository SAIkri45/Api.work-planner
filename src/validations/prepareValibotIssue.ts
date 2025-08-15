export function prepareValibotIssue(dataset: { value: any }, addIssue: (issue: any) => void, key: string, value: any, errMessage: string) {
  return addIssue({
    message: errMessage,
    path: [
      {
        type: "object",
        origin: "value",
        input: dataset.value,
        key,
        value,
      },
    ],
  });
}
