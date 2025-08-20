' Use WScript (not CScript) to avoid any console window
Option Explicit

Dim shell : Set shell = CreateObject("WScript.Shell")
Dim fso   : Set fso   = CreateObject("Scripting.FileSystemObject")

' Configuration
Dim popupUrl : popupUrl = "http://localhost:5173/popup"
' Window size: use 256x256 as requested (the HTML uses ~320x400, adjust here if you prefer)
Dim width    : width    = 256
Dim height   : height   = 256

' Candidate browser paths (prefer Edge, then Chrome). Adjust if installed elsewhere.
Dim edgePaths : edgePaths = Array( _
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", _
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe" _
)
Dim chromePaths : chromePaths = Array( _
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", _
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" _
)

Function FindBrowser()
  Dim i
  ' Try Edge first
  For i = 0 To UBound(edgePaths)
    If fso.FileExists(edgePaths(i)) Then
      FindBrowser = """" & edgePaths(i) & """ --app=""" & popupUrl & """ --window-size=" & CStr(width) & "," & CStr(height)
      Exit Function
    End If
  Next
  ' Then try Chrome
  For i = 0 To UBound(chromePaths)
    If fso.FileExists(chromePaths(i)) Then
      FindBrowser = """" & chromePaths(i) & """ --app=""" & popupUrl & """ --window-size=" & CStr(width) & "," & CStr(height)
      Exit Function
    End If
  Next
  FindBrowser = ""
End Function

Dim cmd : cmd = FindBrowser()
If cmd = "" Then
  ' Fallback: try to open with default browser (regular window)
  shell.Run "rundll32 url.dll,FileProtocolHandler " & popupUrl, 0, False
Else
  ' Run the browser in app mode with desired size, hide this script's window
  shell.Run cmd, 0, False
End If

Set shell = Nothing
Set fso   = Nothing


