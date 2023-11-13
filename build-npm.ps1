<#
.SYNOPSIS
Compiles vite-plugin-single-spa.

.DESCRIPTION
Automates all of the necessary steps to compile and optionally publish the vite-plugin-single-spa package:

1. Runs unit testing.
2. Increments the package version according to what is specified.
3. Compiles the TypeScript source code and outputs it to .\out.
4. Copies the vite-plugin-single-spa.d.ts definition file.
5. Copies the package.json file.
6. Prepares the npmjs.org readme file by joining PublishNote.md and README.md.
7. If the Publish switch is specified, performs actual publishing to the NPM public registry.

NOTE:  If the Publish switch is not specified, then npm publish is run in dry-mode, just to show the potential result of publishing.

Use the Verbose switch to turn on all messages.

.PARAMETER VerUpgrade
Specify a version change.  See the documentation for the command 'npm version' for detailed information.

.PARAMETER PreId
Specify the pre-release ID to use.  Common examples would be 'alpha', 'beta' or 'rc'.  See the documentation for the command 'npm version' for detailed information.

.PARAMETER Publish
Publish the NPM package to npmjs.org.

.PARAMETER SkipTests
Skips unit testing.  Useful to create interim builds for testing.  If this switch is specified, then the Publish switch cannot be specified.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease")]
    [string] $VerUpgrade,
    [Parameter(Mandatory = $false)]
    [string] $PreId,
    [Parameter(Mandatory = $false)]
    [switch] $Publish,
    [Parameter(Mandatory = $false)]
    [switch] $SkipTests
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
    if ($SkipTests -and $Publish) {
        Write-Error "Tests can only be skipped when not publishing."
    }
    elseif (-not $SkipTests) {
        if ($PSCmdlet.ShouldProcess("vite-plugin-single-spa", "Unit Testing")) {
            Invoke-Call { npm run test }
        }
    }
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
    if (Test-Path .\out) {
        Remove-Item -Path .\out -Recurse
    }
    if ($PSCmdlet.ShouldProcess($path, "TypeScript compilation")) {
        npx tsc
    }
    Copy-Item .\src\vite-plugin-single-spa.d.ts .\out
    Copy-Item .\src\package.json .\out
    Copy-Item .\PublishNote.md .\out\README.md -Force
    Get-Content .\README.md | Add-Content .\out\README.md -Encoding UTF8
    if (-not (Test-Path .\out\ex)) {
        New-Item .\out\ex -ItemType Directory
    }
    Copy-Item .\src\ex.d.ts .\out\ex\index.d.ts
    if (!$Publish -and -not $WhatIfPreference) {
        Write-Output "Running npm publish in dry run mode."
        npm publish .\out\ --dry-run
    }
    elseif ($PSCmdlet.ShouldProcess($path, "Publish NPM package")) {
        npm publish .\out\
    }
    elseif ($WhatIfPreference) {
        Write-Verbose "NOTE: Running npm publish in dry run mode using sample data for illustration purposes only."
        if (-not (Test-Path .\out)) {
            New-Item -Path .\out -ItemType Directory -WhatIf:$false
        }
        if (-not (Test-Path .\out\*.js)) {
            New-Item -Path .\out\test.js -ItemType File -WhatIf:$false
        }
        Copy-Item .\src\package.json .\out -WhatIf:$false
        npm publish .\out\ --dry-run
        if (Test-Path .\out\test.js) {
            Remove-Item .\out\test.js -WhatIf:$false
        }
    }
}
