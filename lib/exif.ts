import exifr from 'exifr';

export interface ParsedExif {
  raw: Record<string, unknown>;
  takenAt: Date | null;
  camera: string | null;
  lens: string | null;
  iso: number | null;
  shutter: number | string | null;
  aperture: number | null;
  focalLength: number | null;
}

export async function getExifData(buffer: Buffer): Promise<ParsedExif | null> {
  try {
    // 使用exifr库从图像buffer中提取EXIF数据
    const exifResult = await exifr.parse(buffer, true);
    
    if (!exifResult) {
      return null;
    }

    // 提取相关EXIF信息
    const result: ParsedExif = {
      raw: exifResult,
      takenAt: null,
      camera: null,
      lens: null,
      iso: null,
      shutter: null,
      aperture: null,
      focalLength: null
    };

    // 相机信息 - 组合品牌和型号
    if (exifResult.Make && exifResult.Model) {
      result.camera = `${exifResult.Make} ${exifResult.Model}`;
    } else if (exifResult.Model) {
      result.camera = exifResult.Model;
    }

    // 镜头信息
    if (exifResult.LensModel) {
      result.lens = exifResult.LensModel;
    }

    // ISO值
    if (typeof exifResult.ISO === 'number') {
      result.iso = exifResult.ISO;
    }

    // 快门速度
    if (exifResult.ShutterSpeedValue) {
      // 将快门速度转换为分数表示法
      const shutterValue = exifResult.ShutterSpeedValue;
      if (typeof shutterValue === 'number') {
        const denominator = Math.round(1 / Math.pow(2, -shutterValue));
        result.shutter = `1/${denominator}`;
      } else {
        result.shutter = shutterValue.toString();
      }
    } else if (exifResult.ExposureTime) {
      const exposureTime = exifResult.ExposureTime;
      if (typeof exposureTime === 'number') {
        if (exposureTime < 1) {
          result.shutter = `1/${Math.round(1 / exposureTime)}`;
        } else {
          result.shutter = exposureTime.toString();
        }
      } else {
        result.shutter = exposureTime;
      }
    }

    // 光圈值
    if (typeof exifResult.ApertureValue === 'number') {
      result.aperture = Math.round((Math.pow(2, exifResult.ApertureValue / 2)) * 10) / 10;
    } else if (typeof exifResult.FNumber === 'number') {
      result.aperture = Math.round(exifResult.FNumber * 10) / 10;
    }

    // 焦距
    if (typeof exifResult.FocalLength === 'number') {
      result.focalLength = exifResult.FocalLength;
    } else if (Array.isArray(exifResult.FocalLength) && exifResult.FocalLength.length >= 2) {
      result.focalLength = Math.round(exifResult.FocalLength[0] / exifResult.FocalLength[1]);
    }

    // 拍摄时间 - 优先使用原始拍摄时间
    if (exifResult.DateTimeOriginal) {
      result.takenAt = new Date(exifResult.DateTimeOriginal);
    } else if (exifResult.DateTime) {
      result.takenAt = new Date(exifResult.DateTime);
    } else if (exifResult.CreateDate) {
      result.takenAt = new Date(exifResult.CreateDate);
    }

    return result;
  } catch (error) {
    console.error("读取EXIF数据时出错:", error);
    return null;
  }
}