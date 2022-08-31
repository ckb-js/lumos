// string or { branchName: string, label: string }
const branches = [
  {
    branchName: 'stable',
    label: '0.18.0(latest)'
  },
  {
    branchName: 'develop',
    label: '0.19.x(next)'
  }
];

const parseURL = (branchName) => branchName
  .replaceAll("_", "")
  .replaceAll(".", "")
  .replaceAll("/", "-")

module.exports = branches.map(branch => (
  typeof branch === 'string' 
    ? {
      href: `https://lumos-website-git-${parseURL(branch)}-cryptape.vercel.app/api/`,
      label: branch,
      target: "_blank",
    } 
    : {
      href: `https://lumos-website-git-${parseURL(branch.branchName)}-cryptape.vercel.app/api/`,
      label: branch.label,
      target: "_blank",
    }
))
