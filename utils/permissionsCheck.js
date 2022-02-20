const { getServerConfig } = require("../controllers/servers");

const permissionsCheck = async (interaction) => {
  // Check if server has banner
  const noBannerTiers = ["NONE", "TIER_1"];
  if (noBannerTiers.includes(interaction.guild.premiumTier)) {
    interaction.followUp(
      "Sorry but it looks like your server does not have a banner."
    );
  }

  /* Try to get list of roles from server 
  If gets response check if user has permission */
  const serverConfig = await getServerConfig(interaction.guild.id);
  // If first time setup must be owner
  if (!serverConfig) {
    if (interaction.user.id !== interaction.guild.ownerId) return false;
    return true;
  }
  const permittedRoles = [];
  await serverConfig.roles.map((roleObj) =>
    permittedRoles.push(roleObj.roleId)
  );

  // Guild owner overrides permissions check
  if (interaction.user.id == interaction.guild.ownerId) return permittedRoles;
  if (!permittedRoles.some((role) => interaction.member._roles.includes(role)))
    return false;
  return permittedRoles;
};

module.exports = permissionsCheck;
