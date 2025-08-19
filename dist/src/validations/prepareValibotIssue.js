export function prepareValibotIssue(dataset, addIssue, key, value, errMessage) {
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
