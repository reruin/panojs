:: "C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -resize 12288x2048 +profile "*" 2020140925170000000000000000000000HQTC/raw/cube.tif 2020140925170000000000000000000000HQTC/raw/cube.png

@echo off
:start
set /p id="Input Pano ID:"
::"Raw Image Format( eg:jpg/png/bmp/tif/.. , default is jpg ):" 
set sImgTypeRaw=jpg
set /p sImgTypeRaw="Raw Image Format( eg:jpg/png/bmp/tif/.. , default is jpg ):"


set _quality=95
set /p _quality="JPG Quality(default is 95) : "
set /a quality=_quality
::set img_type_raw = jpg


call :cropPreprocess
echo ²Ù×÷Íê³É
pause
exit
goto :eof

:cropPreprocess
	echo ===== Crop Preprocess =====
	md "%id%/tiles/cube/mid768"
	for /l %%x in (0,1,5) do (
		setlocal enabledelayedexpansion
		set /a ix = 2048 * %%x
		"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -crop 2048x2048+!ix!+0 -resize 768x768 +profile "*"  %id%/raw/cube.%sImgTypeRaw% %id%/tiles/cube/mid768/%%x,0.jpg
	)
	::"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -resize 1536x256+0+0 +profile "*"  %id%/raw/cube.%sImgTypeRaw% %id%/tiles/cube/preview256.jpg
goto :start
::=================== end function=====================

	