
define(
    ["../src/CompositionModelPolicy"],
    function (CompositionModelPolicy) {

        describe("The composition model policy", function () {
            var mockObject,
                mockType,
                policy;

            beforeEach(function () {
                mockType = jasmine.createSpyObj('type', ['getInitialModel']);
                mockObject = {
                    getCapability: function () {
                        return mockType;
                    }
                };
                policy = new CompositionModelPolicy();
            });

            it("only allows composition for types which will have a composition property", function () {
                mockType.getInitialModel.andReturn({});
                expect(policy.allow(mockObject)).toBeFalsy();
                mockType.getInitialModel.andReturn({ composition: [] });
                expect(policy.allow(mockObject)).toBeTruthy();
            });
        });

    }
);
