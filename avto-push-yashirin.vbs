' avto-push.ps1 ni oyna ochmasdan (yashirin) ishga tushiradi - Vazifa rejalashtiruvchisi shuni chaqiradi.
Set fso = CreateObject("Scripting.FileSystemObject")
papka = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "powershell -NoProfile -ExecutionPolicy Bypass -File """ & papka & "\avto-push.ps1""", 0, True
