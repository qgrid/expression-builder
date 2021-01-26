import { Pipe, PipeTransform } from '@angular/core';
import { Node } from '../expression-builder/model/node';
import { MarkupVisitor } from './schema/markup.visitor';
import { SerializationService } from '../expression-builder/serialization.service';
import { visit as convert } from './schema/converter';
import { Validator } from './schema/validator';
import { IConditionBuilderModel } from './condition-builder.model';
import * as fieldService from '../infrastructure/field.service';
import { Guard } from '../infrastructure/guard';

@Pipe({
    name: 'qConditionBuilderMarkup',
    pure: false
})
export class ConditionBuilderPipe implements PipeTransform {
    visitor: MarkupVisitor;

    transform(value: any, model: IConditionBuilderModel): any {
        Guard.notNull(model, 'model');

        const node = value as Node;
        if (node) {
            if (!this.visitor) {
                const validator = new Validator(model);
                const columnMap = fieldService.map(model.fields);
                this.visitor =
                    new MarkupVisitor(
                        key => columnMap[key].title,
                        key => columnMap[key].type,
                        (k, v) => validator.for(k)(v).length === 0
                    );
            }

            const serializer = new SerializationService();
            const filter = serializer.serialize(node);
            const expression = convert(filter);
            if (expression) {
                return this.visitor.visit(expression);
            }
        }

        return null;
    }
}
