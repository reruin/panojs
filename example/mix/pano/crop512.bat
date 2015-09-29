:: "C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -resize 12288x2048 +profile "*" 2020140925170000000000000000000000HQTC/raw/cube.tif 2020140925170000000000000000000000HQTC/raw/cube.png

@echo off
:start
set /p id="Input Pano ID:"
::"Raw Image Format( eg:jpg/png/bmp/tif/.. , default is jpg ):" 
set sImgTypeRaw=jpg
set /p sImgTypeRaw="Raw Image Format( eg:jpg/png/bmp/tif/.. , default is jpg ):"
set _size=512
set /p _size="Tile Size(default is 512) : "
set /a size=_size

set _quality=95
set /p _quality="JPG Quality(default is 95) : "
set /a quality=_quality
::set img_type_raw = jpg


call :cropPreprocess
call :cropThumb
call :cropPreview
call :cropLv
call :cropClear
echo 操作完成
goto :start
pause
exit

:cropThumb
	echo ===== Crop Thumb ======
	"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -crop 2048x1351+0+0 -resize 120x80! -quality 90 +profile "*"  %id%/tiles/cube/_/0.tif %id%/thumb.jpg
goto :eof

:cropPreprocess
	echo ===== Crop Preprocess =====
	md "%id%/tiles/cube/_"
	for /l %%x in (0,1,5) do (
		setlocal enabledelayedexpansion
		set /a ix = 2048 * %%x
		"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -crop 2048x2048+!ix!+0 +profile "*"  %id%/raw/cube.%sImgTypeRaw% %id%/tiles/cube/_/%%x.tif
	)
goto :eof


:cropPreview
	echo ===== Crop Preview =====
	"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -resize 768x128 -quality 50 +profile "*"  %id%/raw/cube.%sImgTypeRaw% %id%/tiles/cube/preview.jpg
goto :eof


:cropClear
	rd /s /q "%id%/tiles/cube/_"
goto :eof

:cropLv
	::"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -resize 3072x512 +profile "*"  %id%/raw/cube.jpg %id%/tiles/cube/1/_.tif
	set /a iz = 1
	for /l %%z in (0,1,2) do (
		echo ===== Crop Level %%z =====
		md "%id%/tiles/cube/%%z/"
		
		setlocal enabledelayedexpansion
		set /a ixb = !iz! * 6 - 1
		set /a iyb = !iz! - 1
		::echo %ixb%
		for /l %%x in (0,1,!ixb!) do (
			for /l %%y in (0,1,!iyb!) do (
				call :crop %%x %%y %%z %size%
			)
		)
		
		set /a iz = !iz! * 2
	)
	set /a iz = 1
goto :eof

:crop
	::set /a ix = %1 * %4
	if %3 == 0 set /a num = 1
	if %3 == 1 set /a num = 2
	if %3 == 2 set /a num = 4
	if %3 == 3 set /a num = 8
	if %3 == 4 set /a num = 16
	:: 裁切面积
	set /a cs =  2048 / %num%
	set /a iy = %2 * %cs%
	set /a ix = (%1 %% %num%) * %cs%
	set /a f = %1 / %num%
	
	echo crop %1,%2,%3
	"C:\Program Files\GraphicsMagick-1.3.20-Q8\gm.exe"  convert -crop %cs%x%cs%+%ix%+%iy% -resize %4x%4 -quality 90 +profile "*"  %id%/tiles/cube/_/%f%.tif %id%/tiles/cube/%3/%1,%2.jpg
goto :eof
::=================== end function=====================

	