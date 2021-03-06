/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

describe('GGRC Utils Query API', function () {
  describe('buildParams() method', function () {
    var relevant;
    var objectName;
    var paging;
    var method;

    beforeEach(function () {
      paging = {
        current: 1,
        total: null,
        pageSize: 10,
        filter: '',
        count: 6
      };

      method = GGRC.Utils.QueryAPI.buildParams;
    });

    describe('Assessment related to Audit', function () {
      beforeEach(function () {
        relevant = {type: 'Audit', id: 1};
        objectName = 'Assessment';
      });

      it('return default params for paging request', function () {
        var result = method(objectName, paging, relevant)[0];

        expect(result.object_name).toEqual('Assessment');
        expect(result.limit).toEqual([0, 10]);
        expect(result.filters.expression.object_name).toEqual('Audit');
      });

      it('return limit for 3rd page', function () {
        var result;
        paging.current = 3;
        paging.pageSize = 50;

        result = method(objectName, paging, relevant)[0];

        expect(result.limit).toEqual([100, 150]);
      });
    });

    describe('Request related to Assessment', function () {
      beforeEach(function () {
        relevant = {
          id: 1,
          type: 'Assessment'
        };
        objectName = 'Request';
      });

      it('return default params for paging request', function () {
        var result = method(objectName, paging, relevant)[0];

        expect(result.object_name).toEqual('Request');
        expect(result.limit).toEqual([0, 10]);
        expect(result.filters.expression.object_name).toEqual('Assessment');
      });

      it('return expression for filter', function () {
        var filterResult;
        paging.filter = 'status="in progress"';

        filterResult =
          method(objectName, paging, relevant)[0].filters.expression.right;

        expect(filterResult.left).toEqual('status');
        expect(filterResult.right).toEqual('in progress');
        expect(filterResult.op.name).toEqual('=');
      });
    });

    describe('Correct data for filter expression', function () {
      beforeEach(function () {
        relevant = {
          id: 28,
          type: 'foo',
          operation: 'op'
        };
        objectName = 'bar';
      });

      it('return correct ids', function () {
        var result = method(objectName, paging, relevant)[0];

        expect(result.filters.expression.ids.length).toEqual(1);
        expect(result.filters.expression.ids).toContain('28');
      });
    });

    describe('Assessments owned by the Person', function () {
      beforeEach(function () {
        relevant = {
          id: 1,
          type: 'Person',
          operation: 'owned'
        };
        objectName = 'Assessment';
      });

      it('return owned as operation type', function () {
        var result = method(objectName, paging, relevant)[0];

        expect(result.object_name).toEqual('Assessment');
        expect(result.filters.expression.object_name).toEqual('Person');
        expect(result.filters.expression.op.name).toEqual('owned');
      });
    });

    describe('filter builder', function () {
      var relevantType = 'dummyType1';
      var requestedType = 'dummyType2';
      var pageWithFilter = {filter: 'field = value'};
      var pageNoFilter = {filter: undefined};
      var relevant = {id: 1, type: relevantType};
      var additionalFilter = {
        expression: {
          op: {name: '~'},
          left: 'foo',
          right: 'bar'
        }
      };
      var result;

      var flattenOps = function (expression) {
        if (expression && expression.op) {
          return [expression.op.name].concat(flattenOps(expression.left))
                                     .concat(flattenOps(expression.right));
        }
        return [];
      };

      var checkOps = function (expression, expectedOps) {
        return _.isEqual(flattenOps(expression).sort(),
                         expectedOps.sort());
      };

      it('returns empty expression for no filtering parameters', function () {
        result = method(requestedType, pageNoFilter, undefined, undefined)[0];

        expect(_.isObject(result.filters.expression)).toBe(true);
        expect(_.isEmpty(result.filters.expression)).toBe(true);
      });

      it('returns correct filters for just text filter',
         function () {
           result = method(requestedType, pageWithFilter, undefined,
                           undefined)[0];

           expect(checkOps(result.filters.expression, ['='])).toBe(true);
         });

      it('returns correct filters for just relevant object',
         function () {
           result = method(requestedType, pageNoFilter, relevant,
                           undefined)[0];

           expect(checkOps(result.filters.expression, ['relevant'])).toBe(true);
         });

      it('returns correct filters for just additionalFilter',
         function () {
           result = method(requestedType, pageNoFilter, undefined,
                           additionalFilter)[0];

           expect(checkOps(result.filters.expression, ['~'])).toBe(true);
         });

      it('returns correct filters for just text filter and relevant object',
         function () {
           result = method(requestedType, pageWithFilter, relevant,
                           undefined)[0];

           expect(checkOps(result.filters.expression,
                           ['=', 'AND', 'relevant'])).toBe(true);
         });

      it('returns correct filters for just text filter and additionalFilter',
         function () {
           result = method(requestedType, pageWithFilter, undefined,
                           additionalFilter)[0];

           expect(checkOps(result.filters.expression,
                           ['=', 'AND', '~'])).toBe(true);
         });

      it('returns correct filters for just relevant object and ' +
         'additionalFilter',
         function () {
           result = method(requestedType, pageNoFilter, relevant,
                           additionalFilter)[0];

           expect(checkOps(result.filters.expression,
                           ['relevant', 'AND', '~'])).toBe(true);
         });

      it('returns correct filters for text filter, relevant object and ' +
         'additionalFilter',
         function () {
           result = method(requestedType, pageWithFilter, relevant,
                           additionalFilter)[0];

           expect(checkOps(result.filters.expression,
                           ['=', 'AND', 'relevant', 'AND', '~'])).toBe(true);
         });
    });
  });
});
