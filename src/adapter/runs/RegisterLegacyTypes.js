define([

], function (

) {
    function RegisterLegacyTypes(types, openmct) {
        openmct.types.importLegacyTypes(types);
    }

    return RegisterLegacyTypes;
});
