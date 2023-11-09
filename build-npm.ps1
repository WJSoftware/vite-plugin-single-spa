<#
.SYNOPSIS
Compiles vite-plugin-single-spa.

.DESCRIPTION
Automates all of the necessary steps to compile and optionally publish the vite-plugin-single-spa package:

1. Increments the package version according to what is specified.
2. Compiles the TypeScript source code and outputs it to .\out.
3. Copies the vite-plugin-single-spa.d.ts definition file.
4. Copies the package.json file.
5. Prepares the npmjs.org readme file by joining PublishNote.md and README.md.
6. If the Publish switch is specified, performs actual publishing to the NPM public registry.

NOTE:  If the Publish switch is not specified, then npm publish is run in dry-mode, just to show the potential result of publishing.

Use the Verbose switch to turn on all messages.

.PARAMETER VerUpgrade
Specify a version change.  See the documentation for the command 'npm version' for detailed information.

.PARAMETER PreId
Specify the pre-release ID to use.  Common examples would be 'alpha', 'beta' or 'rc'.  See the documentation for the command 'npm version' for detailed information.

.PARAMETER Publish
.  Useful to examine the end results.  Note that 'npm publish' will be run in dry mode.

#>
[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease")]
    [string] $VerUpgrade,
    [Parameter(Mandatory = $false)]
    [string] $PreId,
    [Parameter(Mandatory = $false)]
    [switch] $Publish
)
begin {
    function Invoke-Call {
        param (
            [scriptblock]$ScriptBlock,
            [string]$ErrorAction = "Stop"
        )
        & @ScriptBlock
        if (($LASTEXITCODE -ne 0) -and $ErrorAction -eq "Stop") {
            exit $LASTEXITCODE
        }
    }

    $ErrorActionPreference = 'Stop'
    Invoke-Call { npm run test }
    [string] $path = Resolve-Path .\src\package.json
    if ($VerUpgrade -ne '') {
        if ($PSCmdlet.ShouldProcess($path, "Package version increment: $VerUpgrade")) {
            Set-Location .\src
            if ($PreId -ne '') {
                npm version $VerUpgrade --preid $PreId --no-git-tag-version
            }
            else {
                npm version $VerUpgrade --no-git-tag-version
            }
            Set-Location ..\
        }
    }
    else {
        Write-Verbose "Version upgrade was not specified.  The package's version will not be modified."
    }
    $path = Resolve-Path .\
    if (Test-Path .\out\) {
        Remove-Item -Path .\out -Recurse
    }
    New-Item .\out -ItemType Directory
    if ($PSCmdlet.ShouldProcess($path, "TypeScript compilation")) {
        npx tsc
    }
    Copy-Item .\src\vite-plugin-single-spa.d.ts .\out
    Copy-Item .\src\package.json .\out
    Copy-Item .\PublishNote.md .\out\README.md -Force
    Get-Content .\README.md | Add-Content .\out\README.md -Encoding UTF8
    New-Item .\out\ex -ItemType Directory
    Copy-Item .\src\ex.d.ts .\out\ex\index.d.ts
    if (!$Publish) {
        Write-Output "Running npm publish in dry run mode."
        npm publish .\out --dry-run
    }
    elseif ($PSCmdlet.ShouldProcess($path, "Publish NPM package")) {
        npm publish .\out
    }
    elseif ($WhatIfPreference) {
        Write-Verbose "NOTE: Running npm publish in dry run mode using sample data for illustration purposes only."
        if (-not (Test-Path .\out)) {
            New-Item -Path .\out -ItemType Directory -WhatIf:$false
        }
        if (-not (Test-Path .\out\test.js)) {
            New-Item -Path .\out\test.js -ItemType File -WhatIf:$false
        }
        Copy-Item .\src\package.json .\out -WhatIf:$false
        npm publish .\out --dry-run
    }
}
