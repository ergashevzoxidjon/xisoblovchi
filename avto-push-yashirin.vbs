Set fso = CreateObject("Scripting.FileSystemObject")
papka = fso.GetParentFolderName(WScript.ScriptFullName)
Set qobiq = CreateObject("WScript.Shell")
qobiq.CurrentDirectory = papka
qobiq.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & papka & "\avto-push.ps1""", 0, False
