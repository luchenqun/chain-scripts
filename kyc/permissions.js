const Permission1 = 1; // 2^0
const Permission2 = 2; // 2^1
const Permission3 = 4; // 2^2
const Permission4 = 8; // 2^3

const ServiceProvider1Permissions = Permission1 | Permission4;
const ServiceProvider2Permissions = Permission1 | Permission2;
const ServiceProvider3Permissions = Permission3 | Permission4;

const ServiceProviderPermissions = [ServiceProvider1Permissions, ServiceProvider2Permissions, ServiceProvider3Permissions];

const binaryPermission = (permissions) => {
  let str = "";
  const arrPermissions = [Permission1, Permission2, Permission3, Permission4];
  for (const permission of arrPermissions) {
    str = (permissions & permission ? "1" : "0") + str;
  }
  return str;
};

{
  let find = false;
  let sumPermissions = 0;
  const UserNeedPermissions = Permission1 | Permission3 | Permission4;

  console.log("Init Data");
  console.log("UserNeedPermissions          binary", binaryPermission(UserNeedPermissions));
  for (let i = 0; i < ServiceProviderPermissions.length; i++) {
    console.log(`ServiceProvider${i + 1} Permissions binary`, binaryPermission(ServiceProviderPermissions[i]));
  }
  console.log(`Sum${0}Permissions              binary`, binaryPermission(sumPermissions));

  for (let i = 0; i < ServiceProviderPermissions.length; i++) {
    const permissions = ServiceProviderPermissions[i];
    sumPermissions |= permissions;
    const curHasPermissions = sumPermissions & UserNeedPermissions;

    console.log(`\nStep ${i + 1}`);
    // console.log(`ServiceProvider${i + 1} Permissions binary`, binaryPermission(permissions));
    console.log(`Sum${i + 1}Permissions              binary`, binaryPermission(sumPermissions));
    console.log("UserNeedPermissions          binary", binaryPermission(UserNeedPermissions));
    console.log("UserCurHasPermissions        binary", binaryPermission(curHasPermissions));

    if (curHasPermissions == UserNeedPermissions) {
      console.log("UserNeedPermissions === curHasPermissions, success find all permissions");
      find = true;
      break;
    }
  }
  if (!find) {
  }
}
