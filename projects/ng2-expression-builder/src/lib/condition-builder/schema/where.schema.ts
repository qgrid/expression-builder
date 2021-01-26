import { suggestFactory, suggestsFactory } from './suggest.service';
import { ConditionBuilderService, IConditionBuilderSchema } from '../condition-builder.service';
import { isArray, noop } from '../../infrastructure/utility';
import { Validator } from './validator';
import { ConditionBuilderModel, Field } from '../condition-builder.model';

export const getValue = (line, id, props) => {
    const group = line.get(id);
    if (group) {
        if (group.expressions.length === 1) {
            const expr = group.expressions[0];
            const prop = props.filter(p => expr.hasOwnProperty(p))[0];
            if (prop) {
                const value = expr[prop];
                if (isArray(value) && value.length) {
                    return value[0];
                }

                return value;
            }
        }
    }

    return null;
};

function materialize(field): Field {
    return {
        key: field.value,
        title: field.getLabel(field.value),
        type: field.getType(field.value)
    };
}

export class WhereSchema {
    constructor(private model: ConditionBuilderModel) {
    }

    factory(): IConditionBuilderSchema {
        const model = this.model;
        const service = new ConditionBuilderService();
        const suggest = suggestFactory(model, '#field');
        const suggests = suggestsFactory(model, '#field');
        const validator = new Validator(model);
        const defaultField = model.fields.length ? model.fields[0] : null;

        return service
            .build()
            .node('#logical', function (schema) {
                schema
                    .attr('serialize', {
                        '#logical-op': ['value']
                    })
                    .attr('class', {
                        'qb-logical': true,
                        'qb-and': function (node) {
                            const op = node.line.get('#logical-op');
                            return op.expressions[0].value === 'AND';
                        },
                        'qb-or': function (node) {
                            const op = node.line.get('#logical-op');
                            return op.expressions[0].value === 'OR';
                        }
                    })
                    .select('#logical-op', {
                        classes: ['qb-operation'],
                        options: ['AND', 'OR'],
                        value: 'AND'
                    })
                    .node('#condition', function (schema) {
                        schema
                            .attr('serialize', {
                                '#field': ['value'],
                                '#operator': ['value'],
                                '#value': ['value'],
                                '#from': ['value'],
                                '#to': ['value'],
                                '#in-operand': ['values']
                            })
                            .select('#field', {
                                classes: ['qb-field'],
                                options: model.fields.map(c => c.key),
                                value: defaultField ? defaultField.key : '',
                                getLabel: function (node, line, key) {
                                    const column = model.fields.filter(c => c.key === key)[0];
                                    return (column && column.title) || null;
                                },
                                getType: function (node, line, key) {
                                    const column = model.fields.filter(c => c.key === key)[0];
                                    return (column && column.type) || null;
                                },
                                change: function (node, line) {
                                    const ops = model.getOperators(materialize(this));
                                    const op = line.get('#operator').expressions[0];

                                    if (ops.indexOf(op.value) < 0) {
                                        op.value = ops.length ? ops[0] : null;
                                        op.change();
                                    } else {
                                        const operand = line.get('#operand').expressions[0];
                                        if (operand.validate) {
                                            const result = operand.validate();
                                            if (result.length) {
                                                operand.value = null;
                                            }
                                        } else {
                                            operand.value = null;
                                        }
                                    }
                                }
                            })
                            .select('#operator', {
                                classes: ['qb-operator'],
                                getOptions: function (node, line) {
                                    const field = line.get('#field').expressions[0];
                                    return model.getOperators(materialize(field));
                                },
                                value: defaultField ? model.getOperators(defaultField)[0] : null,
                                change: function (node, line) {
                                    switch (this.value.toLowerCase()) {
                                        case 'equals':
                                        case 'not equals':
                                        case 'greater than':
                                        case 'less than':
                                        case 'greater or eq. to':
                                        case 'less or eq. to':
                                        case 'like':
                                        case 'not like':
                                        case 'starts with':
                                        case 'ends with':
                                            const value = getValue(line, '#operand', ['value', 'values']);

                                            line.put('#operand', node, function (schema) {
                                                schema.input('#value', {
                                                    classes: {
                                                        'qb-operand': true,
                                                        'qb-has-value': function () {
                                                            return !!this.value;
                                                        },
                                                        'qb-invalid': function (node) {
                                                            return !this.isValid(node);
                                                        }
                                                    },
                                                    value: value,
                                                    validate: function () {
                                                        const field = line.get('#field').expressions[0].value;
                                                        return validator.for(field)(this.value);
                                                    },
                                                    placeholderText: 'Select value',
                                                    suggest: suggest,
                                                    options: null,
                                                    refresh: function (node, line) {
                                                        this.options = this.suggest(node, line);
                                                    }
                                                });
                                            });
                                            break;
                                        case 'between':
                                            line.put('#operand', node, function (schema) {
                                                schema
                                                    .input('#from', {
                                                        classes: {
                                                            'qb-operand': true,
                                                            'qb-has-value': function () {
                                                                return !!this.value;
                                                            },
                                                            'qb-invalid': function (node) {
                                                                return !this.isValid(node);
                                                            }
                                                        },
                                                        validate: function () {
                                                            const field = line.get('#field').expressions[0].value;
                                                            return validator.for(field)(this.value);
                                                        },
                                                        options: suggest,
                                                        value: null,
                                                        placeholderText: 'Select value'
                                                    })
                                                    .label('#and', {
                                                        classes: ['qb-operand', 'qb-operand-and-label'],
                                                        text: 'AND'
                                                    })
                                                    .input('#to', {
                                                        classes: {
                                                            'qb-operand': true,
                                                            'qb-has-value': function () {
                                                                return !!this.value;
                                                            },
                                                            'qb-invalid': function (node) {
                                                                return !this.isValid(node);
                                                            }
                                                        },
                                                        value: null,
                                                        validate: function () {
                                                            const field = line.get('#field').expressions[0].value;
                                                            return validator.for(field)(this.value);
                                                        },
                                                        placeholderText: 'Select value',
                                                        suggest: suggest,
                                                        options: null,
                                                        refresh: function (node, line) {
                                                            this.options = this.suggest(node, line);
                                                        }
                                                    });
                                            });
                                            break;
                                        case 'in':
                                            line.put('#operand', node, function (schema) {
                                                schema
                                                    .label('#in-open', {
                                                        text: '('
                                                    })
                                                    .multiselect('#in-operand', {
                                                        classes: {
                                                            'qb-operand': true,
                                                            'qb-has-value': function () {
                                                                return !!this.values.length;
                                                            },
                                                            'qb-invalid': function (node) {
                                                                return !this.isValid(node);
                                                            }
                                                        },
                                                        validate: function () {
                                                            const field = line.get('#field').expressions[0].value;
                                                            return validator.for(field)(this.values);
                                                        },
                                                        values: [],
                                                        options: suggests,
                                                        placeholderText: 'Select value',
                                                        add: function (node, line, value) {
                                                            if (value && this.values.indexOf(value) < 0) {
                                                                this.values.push(value);
                                                            }
                                                        }
                                                    })
                                                    .label('#in-close', {
                                                        text: ')'
                                                    });
                                            });
                                            break;
                                        case 'is empty':
                                        case 'is not empty':
                                            line.put('#operand', node, noop);
                                            break;
                                    }
                                }
                            })
                            .group('#operand', function (schema) {
                                schema.input('#value', {
                                    classes: {
                                        'qb-operand': true,
                                        'qb-has-value': function () {
                                            return !!this.value;
                                        },
                                        'qb-invalid': function (node) {
                                            return !this.isValid(node);
                                        }
                                    },
                                    value: null,
                                    validate: function (node, line) {
                                        const field = line.get('#field').expressions[0].value;
                                        return validator.for(field)(this.value);
                                    },
                                    placeholderText: 'Select value',
                                    suggest: suggest,
                                    options: null,
                                    refresh: function (node, line) {
                                        this.options = this.suggest(node, line);
                                    }
                                });
                            });
                    });
            });
    }
}
