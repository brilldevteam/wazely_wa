const validateUser = require("./user");
const { checkPlan } = require("./plan");
const {
  isMenuAllowed,
  resolveMenuId,
} = require("../config/menuPermissions");

function checkMenuPermission(menuId) {
  return (req, res, next) => {
    if (isMenuAllowed(req.plan, menuId)) {
      return next();
    }

    return res.json({
      success: false,
      code: "PLAN_FEATURE_DISABLED",
      msg: "Your plan does not include this feature.",
    });
  };
}

function enforceMenuPermissions(req, res, next) {
  const menuId = resolveMenuId(req.path);
  if (!menuId) {
    return next();
  }

  return validateUser(req, res, () =>
    checkPlan(req, res, () => checkMenuPermission(menuId)(req, res, next)),
  );
}

module.exports = {
  checkMenuPermission,
  enforceMenuPermissions,
  resolveMenuId,
};
