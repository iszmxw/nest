import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Blob } from 'node:buffer';

// 引入你的模块
const itab = require('../utils/itab'); // 根据文件路径可能需要调整

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Body() body, @UploadedFile() file: Express.Multer.File) {
    var resp = {
      code: 1,
      msg: "ok"
    }
    // 获取文件名称
    var filename = body.filename;
    // 文件返回地址
    var img = 'https://files.codelife.cc/' + filename;
    // 上传地址
    const url = 'http://xdlumia2.oss-cn-shenzhen.aliyuncs.com/';
    // OSSAccessKeyId
    const OSSAccessKeyId = 'LTAI5tM1Zd5SRWLFVBeKU5dv';
    // hmac
    const hmac = '5Y5b2hWisRnXXNUJOcPtkg1v2R9dZK';
    // 组装签名参数
    var jsonString = JSON.stringify({
      expiration: new Date(+new Date() + 864e5).toISOString(),
      conditions: [
        {
          // 桶
          bucket: 'xdlumia2',
        },
        {
          key: filename,
        },
        ['content-length-range', 0, 1073741824],
      ],
    });
    // base64 签名参数
    const token = Buffer.from(jsonString, 'utf8').toString('base64');
    // 使用模块中的方法，获得签名
    const signature = itab.b64_hmac(hmac, token);
    // 组装头部参数
    var HeadersData = new Headers();
    HeadersData.append('Accept', '*/*');
    HeadersData.append('Accept-Language', 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7');
    HeadersData.append('Cache-Control', 'no-cache');
    HeadersData.append(
      'Origin',
      'chrome-extension://mhloojimgilafopcmlcikiidgbbnelip',
    );
    HeadersData.append('Pragma', 'no-cache');
    HeadersData.append('Proxy-Connection', 'keep-alive');
    HeadersData.append(
      'User-Agent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    );
    HeadersData.append('X-Requested-With', 'XMLHttpRequest');
    // 组装上传表单参数
    var formdata = new FormData();
    formdata.append('key', filename);
    formdata.append('OSSAccessKeyId', OSSAccessKeyId);
    formdata.append('policy', token);
    formdata.append('Signature', signature);
    // 文件转换为 Blob 格式
    const blobFile: Blob = new Blob([file.buffer], { type: file.mimetype });
    // 指定要上传的文件
    formdata.append('file', blobFile, filename);
    // 组装上传参数，开始上传
    await fetch(url, {
      method: 'POST',
      headers: HeadersData,
      body: formdata,
    })
      .then((response) => {
        if (response.status != 204) {
          console.log('上传失败:', response.status);
          resp.code = response.status;
          resp.msg = "状态码："+response.status;
        } else {
          console.log('上传成功：', response.status, response);
        }
      })
      .then((result) => {
        console.log('上传成功：', result);
      })
      .catch((error) => {
        console.log('error', error);
        resp.code = 0;
        resp.msg = error;
      });
    Object.assign(resp, { img: img });
    console.log(resp);
    return JSON.stringify(resp);
  }

  @Get()
  findAll() {
    return this.uploadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUploadDto: UpdateUploadDto) {
    return this.uploadService.update(+id, updateUploadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadService.remove(+id);
  }
}
