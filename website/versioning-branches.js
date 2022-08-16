// string or { branchName: string, label: string }
const branches = [
  '0.19',
  'next/v0.19.0-alpha.0',
  {
    branchName: 'ckb2021',
    label: 'CKB-2021'
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
