const db = require('../config/db');
                                    const Sequelize = db.sequelize;
                                    const Utils = require('../util/utils');
                                    const utils = require('../util/utils');
                                    const geoip = require('geoip-lite');
                                    const log = require("../config/log");
                                    const statusCode = require('../util/status-code');
                                    const UPLOAD_TYPE = require('../config/consts');
                                    const fetch = require('node-fetch');
                                    const fs = require('fs');
                                    const customerInfo = require('../config/customerInfo');
                                    const userBehaviors = require('../config/userBehaviors');
                                    const citys = require("../config/city");
                                    const provinces = require("../config/province");
                                    const callFile = require('child_process');
                                    const nodemailer = require('nodemailer');
                                    const AccountConfig = require('../config/AccountConfig')
                                    const monitorKeys = require("../config/monitorKeys");
const {CommonModel,HttpLogInfoModel,BehaviorInfoModel,ScreenShotInfoModel,EmailCodeModel,ExtendBehaviorInfoModel,DailyActivityModel,InfoCountByHourModel,IgnoreErrorModel,InfoCountByDayModel,ProjectModel,LoadPageInfoModel,VideosInfoModel,HttpErrorInfoModel,PurchaseCodeModel,UserModel,ResourceLoadInfoModel,CustomerPVModel,JavascriptErrorInfoModel,} = require('../modules/models.js');
class HttpErrorInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await HttpErrorInfoModel.createHttpErrorInfo(data);
      let res = await HttpErrorInfoModel.getHttpErrorInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getHttpErrorInfoList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await HttpErrorInfoModel.getHttpErrorInfoList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await HttpErrorInfoModel.getHttpErrorInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await HttpErrorInfoModel.deleteHttpErrorInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await HttpErrorInfoModel.updateHttpErrorInfo(id, req);
      let data = await HttpErrorInfoModel.getHttpErrorInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }


  /**
   * 根据时间获取一天内http请求错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getHttpErrorInfoListByHour(ctx) {
    const param = Utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.HTTP_ERROR
    let result1 = []
    await HttpErrorInfoModel.getHttpErrorInfoListByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await HttpErrorInfoModel.getHttpErrorInfoListSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }


  /**
   * 获取每天接口请求错误数量列表
   * @returns {Promise.<void>}
   */
  static async getHttpErrorCountByDay(ctx) {
    const param = Utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.HTTP_ERROR
    await HttpErrorInfoModel.getHttpErrorCountByDay(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', Utils.handleDateResult(data))
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }

  /**
   * 获取每天接口请求错误列表
   * @returns {Promise.<void>}
   */
  static async getHttpErrorListByDay(ctx) {

    const param = JSON.parse(ctx.request.body)
    let httpErrorSortList = null
    await HttpErrorInfoModel.getHttpErrorInfoListByDay(param).then(data => {
      httpErrorSortList = data
    })
    for (let i = 0; i < httpErrorSortList.length; i ++) {
      // 查询最近发生时间
      await HttpErrorInfoModel.getHttpErrorLatestTime(httpErrorSortList[i].simpleHttpUrl, param).then(data => {
        httpErrorSortList[i].createdAt = data[0].createdAt
        httpErrorSortList[i].happenTime = data[0].happenTime
      })
      // 查询不同状态的次数
      await HttpErrorInfoModel.getStatusCountBySimpleHttpUrl(httpErrorSortList[i].simpleHttpUrl, param).then(data => {
        httpErrorSortList[i].statusArray = data
      })
      // 查询影响用户数量
      await HttpErrorInfoModel.getCustomerCountForHttpUrl(httpErrorSortList[i].simpleHttpUrl, param).then(data => {
        httpErrorSortList[i].customerCount = data[0].count
      })
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', httpErrorSortList)
  }

  static async getHttpErrorListByUrl(ctx) {
    const param = JSON.parse(ctx.request.body)
    let httpErrorList = []
    // 查询影响用户数量
    await HttpErrorInfoModel.getHttpErrorListByUrl(param).then(data => {
      httpErrorList = data
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', httpErrorList)
  }
}

class ScreenShotInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await ScreenShotInfoModel.createScreenShotInfo(data);
      let res = await ScreenShotInfoModel.getScreenShotInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getScreenShotInfoList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await ScreenShotInfoModel.getScreenShotInfoList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getScreenShotInfoListByPage(ctx) {
    let req = ctx.request

    if (req) {
      const data = await ScreenShotInfoModel.getScreenShotInfoListByPage();
      data.forEach((item) => {
        item.screenInfo = item.screenInfo.toString()
      })
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }

  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await ScreenShotInfoModel.getScreenShotInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await ScreenShotInfoModel.deleteScreenShotInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await ScreenShotInfoModel.updateScreenShotInfo(id, req);
      let data = await ScreenShotInfoModel.getScreenShotInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
}

class HttpLogInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await HttpLogInfoModel.createHttpLogInfo(data);
      let res = await HttpLogInfoModel.getHttpLogInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getHttpLogInfoList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await HttpLogInfoModel.getHttpLogInfoList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await HttpLogInfoModel.getHttpLogInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await HttpLogInfoModel.deleteHttpLogInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await HttpLogInfoModel.updateHttpLogInfo(id, req);
      let data = await HttpLogInfoModel.getHttpLogInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }

  /**
   * 根据时间获取一天内http请求错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getHttpErrorInfoListByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    let result1 = []
    await HttpLogInfoModel.getHttpErrorInfoListByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await HttpLogInfoModel.getHttpErrorInfoListSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }


  /**
   * 获取每天接口请求错误数量列表
   * @returns {Promise.<void>}
   */
  static async getHttpErrorCountByDay(ctx) {
    const param = utils.parseQs(ctx.request.url)
    await HttpLogInfoModel.getHttpErrorCountByDay(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }

  /**
   * 获取每天接口请求错误列表
   * @returns {Promise.<void>}
   */
  static async getHttpErrorListByDay(ctx) {

    const param = JSON.parse(ctx.request.body)
    let resourceErrorSortList = null
    await HttpLogInfoModel.getResourceLoadInfoListByDay(param).then(data => {
      resourceErrorSortList = data
    })
    for (let i = 0; i < resourceErrorSortList.length; i ++) {
      // 查询最近发生时间
      await HttpLogInfoModel.getResourceErrorLatestTime(resourceErrorSortList[i].sourceUrl, param).then(data => {
        resourceErrorSortList[i].createdAt = data[0].createdAt
        resourceErrorSortList[i].happenTime = data[0].happenTime
      })
      // 查询不同状态的次数
      await HttpLogInfoModel.getPageCountByResourceError(resourceErrorSortList[i].sourceUrl, param).then(data => {
        resourceErrorSortList[i].pageCount = data[0].pageCount
      })
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', resourceErrorSortList)
  }

  // 实时获取http请求数量
  static async getHttpCountByMinute(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await HttpLogInfoModel.getHttpCountByMinute(param).then(data => {
      result1 = data
    })
    // let result2 = []
    // await CustomerPVModel.getUvCountByMinute(param).then(data => {
    //   result2 = data
    // })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {http: result1})
  }
}

class DailyActivityController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await DailyActivityModel.createDailyActivity(data);
      let res = await DailyActivityModel.getDailyActivityDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getDailyActivityList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await DailyActivityModel.getDailyActivityList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await DailyActivityModel.getDailyActivityDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await DailyActivityModel.deleteDailyActivity(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await DailyActivityModel.updateDailyActivity(id, req);
      let data = await DailyActivityModel.getDailyActivityDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
}

class BehaviorInfoController {
  /**
   * 创建行为信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    if (data.happenTime) {
      let ret = await BehaviorInfoModel.createBehaviorInfo(data);
      let res = await BehaviorInfoModel.getBehaviorInfoDetail(ret.id);

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建行为信息成功', res)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建行为信息失败，请求参数不能为空！')
    }
  }

  /**
   * 获取行为信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getBehaviorInfoList(ctx) {
    let req = ctx.request.body

    if (req) {
      const data = await BehaviorInfoModel.getBehaviorInfoList();

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询行为信息列表成功！', data)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询行为信息列表失败！');
    }

  }

  /**
   * 查询单条行为信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;

    if (id) {
      let data = await BehaviorInfoModel.getBehaviorInfoDetail(id);

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('行为信息ID必须传');
    }
  }


  /**
   * 删除行为信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;

    if (id && !isNaN(id)) {
      await BehaviorInfoModel.deleteBehaviorInfo(id);

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除行为信息成功！')
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('行为信息ID必须传！');
    }
  }

  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;

    if (req) {
      await BehaviorInfoModel.updateBehaviorInfo(id, req);
      let data = await BehaviorInfoModel.getBehaviorInfoDetail(id);

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新行为信息成功！', data);
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新行为信息失败！')
    }
  }

  /**
   * 测试接口
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async testBehavior(ctx) {
    let req = ctx.request.body

    if (req) {
      const data = await BehaviorInfoModel.testBehavior();

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询行为信息列表成功！', data)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询行为信息列表失败！');
    }

  }
}

class ExtendBehaviorInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.userId) {
      let ret = await ExtendBehaviorInfoModel.createExtendBehaviorInfo(data);
      let res = await ExtendBehaviorInfoModel.getExtendBehaviorInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getExtendBehaviorInfoList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await ExtendBehaviorInfoModel.getExtendBehaviorInfoList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await ExtendBehaviorInfoModel.getExtendBehaviorInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await ExtendBehaviorInfoModel.deleteExtendBehaviorInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await ExtendBehaviorInfoModel.updateExtendBehaviorInfo(id, req);
      let data = await ExtendBehaviorInfoModel.getExtendBehaviorInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
}

class IgnoreErrorController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param)
    /* 判断参数是否合法 */
    if (data.ignoreErrorMessage && data.webMonitorId) {
      let ret = await IgnoreErrorModel.createIgnoreError(data);
      let res = await IgnoreErrorModel.getIgnoreErrorDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getIgnoreErrorList(ctx) {
    let req = ctx.request.body

    if (req) {
      const data = await IgnoreErrorModel.getIgnoreErrorList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }

  /**
   * 根据应用ID获取已经忽略的错误列表列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async ignoreErrorByApplication(ctx) {
    const param = utils.parseQs(ctx.request.url)
    if (param) {
      const data = await IgnoreErrorModel.ignoreErrorByApplication(param);

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }

  }

  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await IgnoreErrorModel.getIgnoreErrorDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await IgnoreErrorModel.deleteIgnoreError(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await IgnoreErrorModel.updateIgnoreError(id, req);
      let data = await IgnoreErrorModel.getIgnoreErrorDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
}

class InfoCountByHourController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await InfoCountByHourModel.createInfoCountByHour(data);
      let res = await InfoCountByHourModel.getInfoCountByHourDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getInfoCountByHourList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await InfoCountByHourModel.getInfoCountByHourList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await InfoCountByHourModel.getInfoCountByHourDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await InfoCountByHourModel.deleteInfoCountByHour(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await InfoCountByHourModel.updateInfoCountByHour(id, req);
      let data = await InfoCountByHourModel.getInfoCountByHourDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
}

class ProjectController {
    /**
     * 创建信息
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async create(ctx) {
        let req = ctx.request.body;

        if (req.title && req.author && req.content && req.category) {
            let ret = await ProjectModel.createProject(req);
            let data = await ProjectModel.getProjectDetail(ret.id);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('创建信息成功', data)
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
        }
    }

    /**
     * 获取信息列表
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async getProjectList(ctx) {
        let req = ctx.request.body
        const param = Utils.parseQs(ctx.request.url)
        if (req) {
            const data = await ProjectModel.getProjectList(param);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('查询信息列表失败！');
        }

    }

    /**
     * 获取信息列表
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async getAllProjectList(ctx) {
        let req = ctx.request.body
        const param = Utils.parseQs(ctx.request.url)
        if (req) {
            const data = await ProjectModel.getAllProjectList(param);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('查询信息列表失败！');
        }

    }
    /**
     * 获取详细信息列表
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async getProjectDetailList(ctx) {
        const param = Utils.parseQs(ctx.request.url)
        const data = await ProjectModel.getProjectDetailList(param);
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    }
    
    /**
     * 查询单条信息数据
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async detail(ctx) {
        let id = ctx.params.id;

        if (id) {
            let data = await ProjectModel.getProjectDetail(id);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('查询成功！', data)
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('信息ID必须传');
        }
    }


    /**
     * 删除信息数据
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async delete(ctx) {
        let id = ctx.params.id;

        if (id && !isNaN(id)) {
            await ProjectModel.deleteProject(id);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('删除信息成功！')
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('信息ID必须传！');
        }
    }
    /**
     * 删除信息数据
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async deleteProject(ctx) {
        const params = Utils.parseQs(ctx.request.url)
        let id = params.id;
        if (id && !isNaN(id)) {
            await ProjectModel.deleteProject(id);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('删除信息成功！')
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('信息ID必须传！');
        }
    }

    /**
     * 更新导航条数据
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async update(ctx) {
        let req = ctx.request.body;
        let id = ctx.params.id;

        if (req) {
            await ProjectModel.updateProject(id, req);
            let data = await ProjectModel.getProjectDetail(id);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('更新信息失败！')
        }
    }

    /**
     * 创建新项目
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async createNewProject(ctx) {
        const data = JSON.parse(ctx.request.body)
        const webMonitorId = data.webMonitorId
        const domain = data.domain
        const mainDomain = data.mainDomain || ""
        if (data) {
            let result = await ProjectModel.checkProjectName(data.projectName)
            const count = parseInt(result[0].count)
            if (count <= 0) {
                let monitorCode = ""
                
                data.monitorCode = monitorCode
                data.projectType = "customer"
                data.remotePath = "//www.webfunny.cn/resource/monitor.fetch.min.js?id=" + webMonitorId
                await fetch("http://www.webfunny.cn/resource/monitor.fetch.min.js")
                    .then( res => res.text())
                    .then( body => {
                        monitorCode = encodeURIComponent(body.toString().replace(/jeffery_webmonitor/g, webMonitorId)
                                        .replace(/&&&www.webfunny.cn&&&/g, domain)
                                        .replace(/&&&webfunny.cn&&&/g, mainDomain));
                    });
                data.monitorCode = monitorCode
                await ProjectModel.createProject(data);
                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('项目创建成功', data)
            } else {
                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('项目名重复，创建项目失败', count)
            }
        } else {
            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
        }
    }

    static async checkProjectCount(ctx) {
        let req = ctx.request.body
        const param = Utils.parseQs(ctx.request.url)
        if (req) {
            const data = await ProjectModel.checkProjectCount(param);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('查询信息列表失败！');
        }

    }
}

class LoadPageInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await LoadPageInfoModel.createLoadPageInfo(data);
      let res = await LoadPageInfoModel.getLoadPageInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getLoadPageInfoList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await LoadPageInfoModel.getLoadPageInfoList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await LoadPageInfoModel.getLoadPageInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await LoadPageInfoModel.deleteLoadPageInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await LoadPageInfoModel.updateLoadPageInfo(id, req);
      let data = await LoadPageInfoModel.getLoadPageInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }

  /**
   * 根据时间获取每天的日活量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getPageLoadTimeByDate(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    if (req) {
      const data = await LoadPageInfoModel.getPageLoadTimeByDate(params);
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  }
}

class UserController {
    /**
     * 创建用户
     * @param ctx
     * @returns {Promise<void>}
     */
    static async create(ctx) {
        const param = ctx.request.body;
        const user = JSON.parse(param)
        if (user.username && user.email && user.emailPwd && user.password) {
            // 查询用户名是否重复
            const existUser = await UserModel.findUserByName(user.username)
            if (existUser) {
                // 反馈存在用户名
                // ctx.response.status = 403;
                // ctx.body = statusCode.ERROR_403('用户已经存在')
                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('用户已经存在', 1)
                return
            }
            
            const existEmail = await UserModel.findUserByEmail(user.email)
            if (existEmail) {
                // 反馈存在用户名
                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('邮箱已经存在', 1)
                return
            }
            const emailCode = await EmailCodeModel.checkEmailCode(user.email, user.emailPwd)
            const emailCodeCount = parseInt(emailCode[0].count, 10)
            if (emailCodeCount === 0) {
                // 反馈存在用户名
                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('邮箱验证码有误, 请重新输入', 1)
                return
            }
            await UserModel.create(user)
            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('创建用户成功')
        } else {
            // 参数错误
            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('创建失败，参数错误');
        }
    }

    /**
     * 查询用户信息
     * @param ctx
     * @returns {Promise<void>}
     */
    static async getUserInfo(ctx) {
        // 获取jwt
        const token = ctx.header.authorization;

        if (token) {
            let payload
            try {
                // 解密payload，获取用户名和ID
                payload = await verify(token.split(' ')[1], secret.sign)

                const user = {
                    id: payload.id,
                    username: payload.username,
                }

                ctx.response.status = 200;
                ctx.body = statusCode.SUCCESS_200('查询成功', user)
            } catch (err) {

                ctx.response.status = 412;
                ctx.body = statusCode.ERROR_412('查询失败，authorization error!')
            }
        }
    }

    /**
     * 删除用户
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async delete(ctx) {
        let id = ctx.params.id;

        if (id && !isNaN(id)) {
            await UserModel.delete(id);

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('删除用户成功')
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('用户ID必须传')
        }
    }

    /**
     * 登录
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async login(ctx) {
        const param = ctx.request.body
        const data = JSON.parse(param)
        // 查询用户
        const user = await UserModel.findUserByLogin(data.email, data.password)
        if (user) {
            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('登录成功', data)
        } else {
            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('登录失败', 1)
        }
    }

    /**
     * 获取用户列表
     * @param ctx
     * @returns {Promise.<void>}
     */
    static async getUserList(ctx) {
        let userList = ctx.request.body;

        if (userList) {
            const data = await UserModel.findAllUserList();

            ctx.response.status = 200;
            ctx.body = statusCode.SUCCESS_200('查询成功', data)
        } else {

            ctx.response.status = 412;
            ctx.body = statusCode.ERROR_412('获取失败')
        }
    }
}

class PurchaseCodeController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await PurchaseCodeModel.createPurchaseCode(data);
      let res = await PurchaseCodeModel.getPurchaseCodeDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getPurchaseCodeList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await PurchaseCodeModel.getPurchaseCodeList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await PurchaseCodeModel.getPurchaseCodeDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await PurchaseCodeModel.deletePurchaseCode(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await PurchaseCodeModel.updatePurchaseCode(id, req);
      let data = await PurchaseCodeModel.getPurchaseCodeDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }

  /**
   * 获取注册码详情
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getPurchaseCodeDetailByCode(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    if (req) {
      const res = await PurchaseCodeModel.getPurchaseCodeDetailByCode(params.purchaseCode);
      const data = res.dataValues
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息成功！', data)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('参数不正确！');
    }
  }
}

class ResourceLoadInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await ResourceLoadInfoModel.createResourceLoadInfo(data);
      let res = await ResourceLoadInfoModel.getResourceLoadInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getResourceLoadInfoList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await ResourceLoadInfoModel.getResourceLoadInfoList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await ResourceLoadInfoModel.getResourceLoadInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await ResourceLoadInfoModel.deleteResourceLoadInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await ResourceLoadInfoModel.updateResourceLoadInfo(id, req);
      let data = await ResourceLoadInfoModel.getResourceLoadInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }

  /**
   * 获取当天静态资源加载错误列表
   * @returns {Promise.<void>}
   */
  static async getResourceLoadInfoListByDay(ctx) {

    const param = JSON.parse(ctx.request.body)
    let resourceErrorSortList = null
    await ResourceLoadInfoModel.getResourceLoadInfoListByDay(param).then(data => {
      resourceErrorSortList = data
    })
    for (let i = 0; i < resourceErrorSortList.length; i ++) {
      // 查询最近发生时间
      await ResourceLoadInfoModel.getResourceErrorLatestTime(resourceErrorSortList[i].sourceUrl, param).then(data => {
        resourceErrorSortList[i].createdAt = data[0].createdAt
        resourceErrorSortList[i].happenTime = data[0].happenTime
      })
      // 查询影响页面
      await ResourceLoadInfoModel.getPageCountByResourceError(resourceErrorSortList[i].sourceUrl, param).then(data => {
        resourceErrorSortList[i].pageCount = data[0].pageCount
      })
      // 查询影响用户
      await ResourceLoadInfoModel.getCustomerCountByResourceError(resourceErrorSortList[i].sourceUrl, param).then(data => {
        resourceErrorSortList[i].customerCount = data[0].customerCount
      })
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', resourceErrorSortList)
  }

  /**
   * 获取每天静态资源加载错误数量列表
   * @returns {Promise.<void>}
   */
  static async getResourceErrorCountByDay(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.RESOURCE_ERROR
    await ResourceLoadInfoModel.getResourceErrorCountByDay(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data))
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }

  /**
   * 根据时间获取一天内静态资源加载错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getResourceErrorCountByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.RESOURCE_ERROR
    let result1 = []
    await ResourceLoadInfoModel.getResourceLoadErrorInfoListByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await ResourceLoadInfoModel.getResourceLoadErrorInfoListSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }

}

class VideosInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await VideosInfoModel.createVideos(data);
      let res = await VideosInfoModel.getVideosDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getVideosList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await VideosInfoModel.getVideosList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await VideosInfoModel.getVideosDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await VideosInfoModel.deleteVideos(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await VideosInfoModel.updateVideos(id, req);
      let data = await VideosInfoModel.getVideosDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }

  /**
   * 
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getVideosEvent(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    await VideosInfoModel.getVideosEvent(param).then(data => {
      const result = []
      data.forEach((item) => {
        item.event = (item.event || "").toString()
        result.push(item)
      })
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', result)
    })
    
  }
}

class EmailCodeController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await EmailCodeModel.createEmailCode(data);
      let res = await EmailCodeModel.getEmailCodeDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getEmailCodeList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await EmailCodeModel.getEmailCodeList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await EmailCodeModel.getEmailCodeDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await EmailCodeModel.deleteEmailCode(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await EmailCodeModel.updateEmailCode(id, req);
      let data = await EmailCodeModel.getEmailCodeDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }

  /**
   * 生成验证码
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async sendEmailCode(ctx) {
    const data = JSON.parse(ctx.request.body)
    const email = data.email
    let lastEmail = null
    // 检查今天这个邮箱是否已经发送了验证码
    lastEmail = await EmailCodeModel.isSendEmailCodeToday(email)
    if (lastEmail.length > 0) {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('验证码一天内有效，无需重复发送', 1);
      return
    }
    const chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    function generateMixed(n) {
      let resStr = "";
      for(let i = 0; i < n ; i ++) {
        let id = Math.ceil(Math.random()*35);
        resStr += chars[id];
      }
      return resStr;
    }
    const code = generateMixed(4)
    const { accountInfo } = AccountConfig
    let transporter = nodemailer.createTransport({
      host: "smtp.163.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: accountInfo.sourceEmail, // generated ethereal user
        pass: accountInfo.sourcePassword // generated ethereal password
      }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"邮箱验证码" <jiang1125712@163.com>', // sender address
      to: email, // list of receivers
      subject: "验证码: " + code, // Subject line
      text: "您好，您的验证码是：" + code, // plain text body
      html: "<b>您好，您的验证码是：" + code + "</b>" // html body
    });
    await EmailCodeModel.saveEmailCode({email, emailCode: code}).then((data) => {
      if (data) {
        nodemailer.getTestMessageUrl(info)
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('success', true);
      }
    });
  }
}

class CustomerPVController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (req.happenTime) {
      let ret = await CustomerPVModel.createCustomerPV(data);
      let res = await CustomerPVModel.getCustomerPVDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getCustomerPVList(ctx) {
    let req = ctx.request.body
  
    if (req) {
      const data = await CustomerPVModel.getCustomerPVList();
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }
  
  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await CustomerPVModel.getCustomerPVDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await CustomerPVModel.deleteCustomerPV(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await CustomerPVModel.updateCustomerPV(id, req);
      let data = await CustomerPVModel.getCustomerPVDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
  
  /**
   * 根据时间获取每天的流量数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getTodayFlowData(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)

    const todayFlowKey = "todayFlowKey--" + params.webMonitorId
    const todayFlow = global.monitorInfo[todayFlowKey]
    const currentTime = new Date().getTime()
    if (todayFlow && (currentTime - todayFlow.happenTime < 10 * 60 * 1000)) {
      const { today, yesterday } = todayFlow
      const result = { today, yesterday }
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', result);
    } else {
      const todayPvData = await CustomerPVModel.getPVCountForDay(params, 0);
      const todayUvData = await CustomerPVModel.getUVCountForDay(params, 0);
      const todayIpData = await CustomerPVModel.getIpCountForDay(params, 0);
      const today = {
        pv: todayPvData[0].count,
        uv: todayUvData[0].count,
        ip: todayIpData[0].count,
        per: (todayPvData[0].count/todayUvData[0].count).toFixed(2)
      }
      let yesterdayPvData = null
      let yesterdayUvData = null
      let yesterdayIpData = null
      let yesterday = null
      try {
        yesterdayPvData = await CustomerPVModel.getPVCountForDay(params, 1);
        yesterdayUvData = await CustomerPVModel.getUVCountForDay(params, 1);
        yesterdayIpData = await CustomerPVModel.getIpCountForDay(params, 1);
        yesterday = {
          pv: yesterdayPvData[0].count,
          uv: yesterdayUvData[0].count,
          ip: yesterdayIpData[0].count,
          per: (yesterdayPvData[0].count/yesterdayUvData[0].count).toFixed(2)
        }
      } catch(e) {
        yesterday = {
          pv: 0,
          uv: 0,
          ip: 0,
          per: 0
        }
      }
      const result = { today, yesterday }
      const todayFlow = { today, yesterday, happenTime: new Date().getTime()}
      global.monitorInfo[todayFlowKey] = todayFlow
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', result);
    }
  }
  /**
   * 根据时间获取每天的日活量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getCustomerCountByTime(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    if (req) {
      const data = await CustomerPVModel.getCustomerCountByTime(params);
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data, params.timeScope))
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  }
  /**
   * 获取24小时内每小时user数量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getUserCountByHour(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await CustomerPVModel.getUserCountByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await CustomerPVModel.getUserCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }
  /**
   * 获取24小时内每小时UV量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getUvCountByHour(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await CustomerPVModel.getUvCountByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await CustomerPVModel.getUvCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }
  /**
   * 获取24小时内每小时PV量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getPvCountByHour(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await CustomerPVModel.getPvCountByTime(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await CustomerPVModel.getPvCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }
  /**
   * 获取24小时内每小时新用户量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getNewCustomerCountByHour(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await CustomerPVModel.getNewCustomerCountByTime(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await CustomerPVModel.getNewCustomerCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    let total = 0
    await CustomerPVModel.getNewCustomerCountByToday(param).then(data => {
      total = data[0].count;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2, total})
  }
  /**
   * 获取24小时内每小时平均安装量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getInstallCountByHour(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await CustomerPVModel.getInstallCountByTime(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await CustomerPVModel.getInstallCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }

  static async getPvUvCountBySecond(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await CustomerPVModel.getPvCountBySecond(param).then(data => {
      result1 = data
    })
    let result2 = []
    await CustomerPVModel.getUvCountBySecond(param).then(data => {
      result2 = data
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {pv: result1, uv: result2})
  }
  static async getPvCountByMinute(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    // let result1 = []
    // await CustomerPVModel.getPvCountByMinute(param).then(data => {
    //   result1 = data
    // })
    let result2 = []
    await CustomerPVModel.getUvCountByMinute(param).then(data => {
      result2 = data
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {uv: result2})
  }

  static async getProvinceCountBySeconds(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    const pvList = await CustomerPVModel.getPvsInfoByTenSeconds(param)
    const provinceData = await CustomerPVModel.getProvinceCountBySeconds(param)
    for (let i = 0; i < provinceData.length; i ++) {
      let key = provinceData[i].name
      provinceData[i].name = provinces[key] ? provinces[key] : "其他"
    }
    for (let i = 0; i < pvList.length; i ++) {
      let key = pvList[i].province
      pvList[i].province = provinces[key] ? provinces[key] : "未知地区"
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {pvList, provinceData})
  }

  static async getVersionCountOrderByCount(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    const data = await CustomerPVModel.getVersionCountOrderByCount(params);
    data.forEach((item, index) => {
      if (item.projectVersion) {
        data[index].projectVersion = utils.b64DecodeUnicode(item.projectVersion)
      }
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
  }

  static async getCityCountOrderByCount(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    const data = await CustomerPVModel.getCityCountOrderByCount(params);
    for (let i = 0; i < data.length; i ++) {
      let cityKey = data[i].city.replace("'", "")
      data[i].city = citys[cityKey] || cityKey
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
  }

  static async getDeviceCountOrderByCount(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    const data = await CustomerPVModel.getDeviceCountOrderByCount(params);
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
  }

  static async getPvListByPage(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    const data = await CustomerPVModel.getPvListByPage(params);
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)

  }
  static async getSevenDaysLeftCount(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    const sevenDayLeftKey = "sevenDayLeftArray" + params.webMonitorId + new Date().Format("yyyyMMdd")
    let data = null
    try {
      if (global.monitorInfo[sevenDayLeftKey]) {
        data = global.monitorInfo[sevenDayLeftKey]
      } else {
        const day = parseInt(params.day, 10)
        const dateArray = []
        for (let i = day - 1; i > 0; i --) {
          const currentDay = utils.addDays(0 - i)
          dateArray.push(currentDay)
        }
        const result = []
        const tempData = await CustomerPVModel.getSevenDaysLeftCount(params);
        tempData.forEach((item, index) => {
          let obj = {date: dateArray[index], count: item.count}
          result.push(obj)
        })
        data = result
        global.monitorInfo[sevenDayLeftKey] = result
      }
    } catch(e) {
      data = [ 
        { date: 'day1', count: '0' },
        { date: 'day2', count: '0' },
        { date: 'day3', count: '0' },
        { date: 'day4', count: '0' },
        { date: 'day5', count: '0' },
        { date: 'day6', count: '0' },
        { date: 'day7', count: '0' }
      ]
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
  }
  /**
   * 根据平台类型，获取设备分类
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getOsAnalysis(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    if (req) {
      const data = await CustomerPVModel.getCustomerCountByTime(params);
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data, params.timeScope))
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  }

  /**
   * 根据平台类型，获取设备分类
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getOsAnalysis(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    if (req) {
      const data = await CustomerPVModel.getCustomerCountByTime(params);
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data, params.timeScope))
    } else {

      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  }
}

class JavascriptErrorInfoController {
  /**
   * 创建信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async create(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param.data)
    /* 判断参数是否合法 */
    if (data.happenTime) {
      let ret = await JavascriptErrorInfoModel.createJavascriptErrorInfo(data);
      let res = await JavascriptErrorInfoModel.getJavascriptErrorInfoDetail(ret.id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('创建信息成功', res)
    } else {
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('创建信息失败，请求参数不能为空！')
    }
  }
  
  /**
   * 获取信息列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorInfoList(ctx) {
    let req = ctx.request.body

    if (req) {
      const data = await JavascriptErrorInfoModel.getJavascriptErrorInfoList();

      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('查询信息列表失败！');
    }
  
  }

  /**
   * 获取每分钟JS错误的数量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorCountByMinute(ctx) {
    let req = ctx.request.body
    const param = JSON.parse(req)
    let result1 = []
    await JavascriptErrorInfoModel.getJavascriptErrorCountByMinute(param).then(data => {
      result1 = data
    })
    // let result2 = []
    // await CustomerPVModel.getUvCountByMinute(param).then(data => {
    //   result2 = data
    // })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success！', {jsError: result1})
  }

  /**
   * 根据时间获取JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorInfoListByDay(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.ON_ERROR
    await JavascriptErrorInfoModel.getJavascriptErrorInfoListByDay(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data))
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }
  /**
   * 根据时间获取自定义JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getConsoleErrorInfoListByDay(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.CONSOLE_ERROR
    await JavascriptErrorInfoModel.getConsoleErrorInfoListByDay(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data))
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }

  /**
   * 根据时间获取一天内JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorInfoListByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.ON_ERROR
    let result1 = []
    await JavascriptErrorInfoModel.getErrorCountByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await JavascriptErrorInfoModel.getErrorCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }

  /**
   * 根据时间获取一天内某个JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorCountListByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    await JavascriptErrorInfoModel.getJavascriptErrorCountListByHour(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data)
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }
  /**
   * 根据时间获取一天内某个JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJsErrorCountByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.ON_ERROR
    let result1 = []
    await JavascriptErrorInfoModel.getErrorCountByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await JavascriptErrorInfoModel.getErrorCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }
  /**
   * 根据时间获取一天内自定义JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptConsoleErrorInfoListByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    param.infoType = UPLOAD_TYPE.CONSOLE_ERROR
    let result1 = []
    await JavascriptErrorInfoModel.getErrorCountByHour(param).then(data => {
      result1 = data;
    })
    let result2 = []
    await JavascriptErrorInfoModel.getErrorCountSevenDayAgoByHour(param).then(data => {
      result2 = data;
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', {today: result1, seven: result2})
  }

  /**
   * 根据JS错误的数量进行排序
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorSort(ctx) {
    const param = JSON.parse(ctx.request.body)
    let errorSortList = []
    await JavascriptErrorInfoModel.getJavascriptErrorSort(param).then(data => {
      errorSortList = data
    })
    for (let i = 0; i < errorSortList.length; i ++) {
      await JavascriptErrorInfoModel.getJavascriptErrorLatestTime(errorSortList[i].errorMessage, param).then(data => {
        errorSortList[i].createdAt = data[0].createdAt
        errorSortList[i].happenTime = data[0].happenTime
      })
      await JavascriptErrorInfoModel.getJavascriptErrorAffectCount(errorSortList[i].errorMessage, param).then(data => {
        errorSortList[i].customerCount = data[0].count
      })
      await JavascriptErrorInfoModel.getPerJavascriptErrorCountByOs(errorSortList[i].errorMessage, param).then(data => {
        errorSortList[i].osInfo = data
      })
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', errorSortList)
  }

  /**
   * 根据JS错误的数量进行排序
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getConsoleErrorSort(ctx) {
    const param = JSON.parse(ctx.request.body)
    let errorSortList = []
    await JavascriptErrorInfoModel.getConsoleErrorSort(param).then(data => {
      errorSortList = data
    })
    for (let i = 0; i < errorSortList.length; i ++) {
      await JavascriptErrorInfoModel.getJavascriptErrorLatestTime(errorSortList[i].errorMessage, param).then(data => {
        errorSortList[i].createdAt = data[0].createdAt
        errorSortList[i].happenTime = data[0].happenTime
      })
      await JavascriptErrorInfoModel.getPerJavascriptConsoleErrorCount(errorSortList[i].errorMessage, param).then(data => {
        errorSortList[i].osInfo = data
      })
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', errorSortList)
  }

  /**
   * 查询最近六小时内JS错误的数量信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorCountByHour(ctx) {
    const param = utils.parseQs(ctx.request.url)
    await JavascriptErrorInfoModel.getJavascriptErrorCountByHour(param).then(data => {
      if (data) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', utils.handleDateResult(data))
      } else {
        ctx.response.status = 412;
        ctx.body = statusCode.ERROR_412('查询信息列表失败！');
      }
    })
  }

  /**
   * 查询对应平台js错误的数量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorCountByOs(ctx) {
    const param = utils.parseQs(ctx.request.url)
    const result = {};
    const {day} = param;
    param.day = utils.addDays(0 - day) + " 00:00:00"
    await JavascriptErrorInfoModel.getJavascriptErrorPcCount(param).then(data => {
      result.pcError = data.length ? data[0] : 0;
    })
    await JavascriptErrorInfoModel.getJavascriptErrorIosCount(param).then(data => {
      result.iosError = data.length ? data[0] : 0;
    })
    await JavascriptErrorInfoModel.getJavascriptErrorAndroidCount(param).then(data => {
      result.androidError = data.length ? data[0] : 0;
    })

    await CustomerPVModel.getCustomerPvPcCount(param).then(data => {
      result.pcPv = data.length ? data[0] : 0;
    })
    await CustomerPVModel.getCustomerPvIosCount(param).then(data => {
      result.iosPv = data.length ? data[0] : 0;
    })
    await CustomerPVModel.getCustomerPvAndroidCount(param).then(data => {
      result.androidPv = data.length ? data[0] : 0;
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', result);
    })
  }
  /**
   * 查询分类js错误的数量
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorCountByType(ctx) {
    const param = utils.parseQs(ctx.request.url)
    const {day} = param;
    param.day = utils.addDays(0 - day) + " 00:00:00"
    await JavascriptErrorInfoModel.getJavascriptErrorCountByType(param).then(data => {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息成功！', data);
    })

  }
  /**
   * 根据errorMsg查询Js错误列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorListByMsg(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param)
    await JavascriptErrorInfoModel.getJavascriptErrorListByMsg(decodeURIComponent(data.errorMsg), data).then(data => {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data);
    })
  }

  static async getJavascriptErrorAboutInfo(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param)
    const result = {}
    await JavascriptErrorInfoModel.getJavascriptErrorAffectCount(decodeURIComponent(data.errorMsg), data).then(data => {
      result.customerCount = data[0].count
    })
    await JavascriptErrorInfoModel.getJavascriptErrorOccurCountByCustomerKey(decodeURIComponent(data.errorMsg), data).then(data => {
      result.occurCount = data[0].count
    })
    await JavascriptErrorInfoModel.getAllJavascriptErrorCountByOs(decodeURIComponent(data.errorMsg), data).then(data => {
      result.osInfo = {}
      data.forEach((item) => {
        result.osInfo[item.os] = item.count
      })
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', result);
    })
  }

  /**
   * 根据页面查询Js错误列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorListByPage(ctx) {
    const param = utils.parseQs(ctx.request.url)
    await JavascriptErrorInfoModel.getJavascriptErrorListByPage(param).then(data => {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data);
    })
  }

  /**
   * 根据errorMsg查询Js错误列表
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getJavascriptErrorStackCode(ctx) {
    const param = ctx.request.body
    const data = JSON.parse(param)
    await JavascriptErrorInfoModel.getJavascriptErrorStackCode(data.stackList).then(data => {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询信息列表成功！', data);
    })
  }

  /**
   * 查询单条信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async detail(ctx) {
    let id = ctx.params.id;
  
    if (id) {
      let data = await JavascriptErrorInfoModel.getJavascriptErrorInfoDetail(id);
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('查询成功！', data)
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传');
    }
  }
  
  
  /**
   * 删除信息数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async delete(ctx) {
    let id = ctx.params.id;
  
    if (id && !isNaN(id)) {
      await JavascriptErrorInfoModel.deleteJavascriptErrorInfo(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('删除信息成功！')
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('信息ID必须传！');
    }
  }
  
  /**
   * 更新导航条数据
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async update(ctx) {
    let req = ctx.request.body;
    let id = ctx.params.id;
  
    if (req) {
      await JavascriptErrorInfoModel.updateJavascriptErrorInfo(id, req);
      let data = await JavascriptErrorInfoModel.getJavascriptErrorInfoDetail(id);
  
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', data);
    } else {
  
      ctx.response.status = 412;
      ctx.body = statusCode.ERROR_412('更新信息失败！')
    }
  }
}

class Common {
  static async consoleInfo() {
    console.log("\x1B[33m%s\x1b[0m", "==============================================================")
    console.log("= ")
    console.log("= 作者：一步一个脚印一个坑 ")
    console.log("= ")
    console.log("= 网站：www.webfunny.cn ")
    console.log("= ")
    console.log("= 系统还在不断完善中，欢迎Star，你的关注会让我们做得更好！")
    console.log("= ")
    console.log("=【微信号: 】webfunny_2020")
    console.log("= ")
    console.log("\x1B[33m%s\x1b[0m", "==============================================================")
  }
  /**
   * 接受并分类处理上传的日志
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async upLog(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('1')
    let infoType = ""
    try {
      const monitorVersion = "1.0.0"
      if (!(global.web_monitor_version && global.web_monitor_version == monitorVersion)) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('版本号不正确，请更新最新代码 - ' + global.web_monitor_version)
        return
      }
      var req = ctx.req
      const clientIpString = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
      let province = ""
      let city = ""
      // 暂时先把线上的日志记录过滤掉
      // Common.handleLongEvents(ctx.request.body.data)
      const paramStr = ctx.request.body.data.replace(/": Script error\./g, "script error")
      const param = JSON.parse(paramStr)
      const logArray = param.logInfo.split("$$$")
      for(var i = 0; i < logArray.length; i ++) {
        if (!logArray[i]) continue;
        const logInfo = JSON.parse(logArray[i]);
        for( let key in logInfo) {
          if (monitorKeys[key]) {
            logInfo[monitorKeys[key]] = logInfo[key]
            delete logInfo[key]
          }
        }
        logInfo.monitorIp = clientIpString
        logInfo.userId = Utils.md5Encrypt(logInfo.userId || "")
        logInfo.happenTime = logInfo.happenTime + ""
        // 敏感信息加密处理
        // try {
        //   let completeUrl = Utils.b64DecodeUnicode(logInfo.completeUrl);
        //   logInfo.completeUrl = completeUrl ? completeUrl.replace(/([0-9a-zA-Z]{4}-){2,4}[0-9a-zA-Z]{1,4}/g, "****-") : completeUrl
        // } catch (e) {
        //   logInfo.completeUrl = logInfo.completeUrl
        // }
        logInfo.completeUrl = Utils.b64DecodeUnicode(logInfo.completeUrl);
        // 对url进行加密处理
        Common.encryptUrl(logInfo)
        infoType = logInfo.uploadType
        switch (logInfo.uploadType) {
          case "ELE_BEHAVIOR":
            await BehaviorInfoModel.createBehaviorInfo(logInfo, Sequelize);
            break;
          case "JS_ERROR":
            await JavascriptErrorInfoModel.createJavascriptErrorInfo(logInfo, Sequelize);
            break;
          case "HTTP_LOG":
            if (logInfo.responseText) {
              logInfo.responseText = logInfo.responseText.length > 300 ? "内容太长" : logInfo.responseText
            }
            const status = parseInt(logInfo.status || 0)
            if (status > 299) {
              await HttpErrorInfoModel.createHttpErrorInfo(logInfo, Sequelize);
            } else {
              await HttpLogInfoModel.createHttpLogInfo(logInfo, Sequelize);
            }
            break;
          case "SCREEN_SHOT":
            await ScreenShotInfoModel.createScreenShotInfo(logInfo, Sequelize);
            break;
          case "CUSTOMER_PV":
            // 根据IP地址获取位置
            const monitorIp = logInfo.monitorIp
            var geo = geoip.lookup(monitorIp);
            if (geo) {
              logInfo.province =  provinces[geo.region] ? geo.region : "其他"
              logInfo.city = citys[geo.city] || geo.city
            }
            // 根据customerKey来判断是否为新用户
            let newStatus = ""
            const customerKeyArr = logInfo.customerKey ? logInfo.customerKey.match(/\d{13}/g) : []
            if (customerKeyArr && customerKeyArr.length > 0) {
              const tempTime = parseInt(customerKeyArr[0], 10) + 8 * 60 * 60 * 1000
              const dateStr = new Date(tempTime).Format("yyyy-MM-dd")
              const currentTime = new Date().getTime()
              logInfo.customerKeyCreatedDate = dateStr;
              newStatus = currentTime - tempTime > 60 * 1000 ? "old" : "new"
            }
            if (!logInfo.newStatus) {
              logInfo.newStatus = newStatus
            }
            await CustomerPVModel.createCustomerPV(logInfo, Sequelize);
            break;
          case "LOAD_PAGE":
            await LoadPageInfoModel.createLoadPageInfo(logInfo, Sequelize);
            break;
          case "RESOURCE_LOAD":
            if (logInfo.sourceUrl) {
              await ResourceLoadInfoModel.createResourceLoadInfo(logInfo, Sequelize);
            }
            break;
          case "VIDEOS_EVENT":
            await VideosInfoModel.createVideos(logInfo, Sequelize);
            break;
          case "CUSTOMIZE_BEHAVIOR":
          default:
            await ExtendBehaviorInfoModel.createExtendBehaviorInfo(logInfo, Sequelize);
            break;
        }
      }
    } catch(e) {
      log.printError(e + " -- " + infoType)
    }
  }
  /**
   * debug模式：接受并分类处理上传的日志
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async upDebugLog(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('1')
    let infoType = ""
    try {
      const monitorVersion = "1.0.0"
      if (!(global.web_monitor_version && global.web_monitor_version == monitorVersion)) {
        ctx.response.status = 200;
        ctx.body = statusCode.SUCCESS_200('版本号不正确，请更新最新代码 - ' + global.web_monitor_version)
        return
      }
      var req = ctx.req
      const clientIpString = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
      let province = ""
      let city = ""
      // 暂时先把线上的日志记录过滤掉
      // Common.handleLongEvents(ctx.request.body.data)
      const paramStr = ctx.request.body.data.replace(/": Script error\./g, "script error")
      const param = JSON.parse(paramStr)
      const logArray = param.logInfo.split("$$$")
      for(var i = 0; i < logArray.length; i ++) {
        if (!logArray[i]) continue;
        const logInfo = JSON.parse(logArray[i]);
        for( let key in logInfo) {
          if (monitorKeys[key]) {
            logInfo[monitorKeys[key]] = logInfo[key]
            delete logInfo[key]
          }
        }
        logInfo.monitorIp = clientIpString
        logInfo.userId = Utils.md5Encrypt(logInfo.userId || "")
        logInfo.happenTime = logInfo.happenTime + ""
        // 敏感信息加密处理
        // try {
        //   let completeUrl = Utils.b64DecodeUnicode(logInfo.completeUrl);
        //   logInfo.completeUrl = completeUrl ? completeUrl.replace(/([0-9a-zA-Z]{4}-){2,4}[0-9a-zA-Z]{1,4}/g, "****-") : completeUrl
        // } catch (e) {
        //   logInfo.completeUrl = logInfo.completeUrl
        // }
        logInfo.completeUrl = Utils.b64DecodeUnicode(logInfo.completeUrl);
        // 对url进行加密处理
        Common.encryptUrl(logInfo)
        infoType = logInfo.uploadType
        switch (logInfo.uploadType) {
          case "ELE_BEHAVIOR":
            await BehaviorInfoModel.createBehaviorInfo(logInfo, Sequelize);
            break;
          case "JS_ERROR":
            await JavascriptErrorInfoModel.createJavascriptErrorInfo(logInfo, Sequelize);
            break;
          case "HTTP_LOG":
            if (logInfo.responseText) {
              logInfo.responseText = logInfo.responseText.length > 300 ? "内容太长" : logInfo.responseText
            }
            const status = parseInt(logInfo.status || 0)
            if (status > 299) {
              await HttpErrorInfoModel.createHttpErrorInfo(logInfo, Sequelize);
            } else {
              await HttpLogInfoModel.createHttpLogInfo(logInfo, Sequelize);
            }
            break;
          case "SCREEN_SHOT":
            await ScreenShotInfoModel.createScreenShotInfo(logInfo, Sequelize);
            break;
          case "CUSTOMER_PV":
            // 根据IP地址获取位置
            const monitorIp = logInfo.monitorIp
            var geo = geoip.lookup(monitorIp);
            if (geo) {
              logInfo.province =  provinces[geo.region] ? geo.region : "其他"
              logInfo.city = citys[geo.city] || geo.city
            }
            // 根据customerKey来判断是否为新用户
            let newStatus = ""
            const customerKeyArr = logInfo.customerKey ? logInfo.customerKey.match(/\d{13}/g) : []
            if (customerKeyArr && customerKeyArr.length > 0) {
              const tempTime = parseInt(customerKeyArr[0], 10) + 8 * 60 * 60 * 1000
              const dateStr = new Date(tempTime).Format("yyyy-MM-dd")
              const currentTime = new Date().getTime()
              logInfo.customerKeyCreatedDate = dateStr;
              newStatus = currentTime - tempTime > 60 * 1000 ? "old" : "new"
            }
            if (!logInfo.newStatus) {
              logInfo.newStatus = newStatus
            }
            await CustomerPVModel.createCustomerPV(logInfo, Sequelize);
            break;
          case "LOAD_PAGE":
            await LoadPageInfoModel.createLoadPageInfo(logInfo, Sequelize);
            break;
          case "RESOURCE_LOAD":
            if (logInfo.sourceUrl) {
              await ResourceLoadInfoModel.createResourceLoadInfo(logInfo, Sequelize);
            }
            break;
          case "VIDEOS_EVENT":
            await VideosInfoModel.createVideos(logInfo, Sequelize);
            break;
          case "CUSTOMIZE_BEHAVIOR":
          default:
            await ExtendBehaviorInfoModel.createExtendBehaviorInfo(logInfo, Sequelize);
            break;
        }
      }
    } catch(e) {
      log.printError(e + " -- " + infoType)
    }
  }
  // 处理超长的录屏信息
  static handleLongEvents(data) {
    let buf = Buffer.concat(JSON.parse(data).events);
  }

  static encryptUrl(logInfo) {
    const reg = /https?:\/\/\S+[\.\:]([a-zA-Z0-9]+\/){1}/g
    if (logInfo.completeUrl) {
      try {
        const pathName = decodeURIComponent(logInfo.completeUrl).replace(reg, "")
        const urlArray = decodeURIComponent(logInfo.completeUrl).match(reg)[0].split(".")
        const len = urlArray.length
        const tempUrl = urlArray[0] + "**" + urlArray[len - 1] + pathName
        logInfo.completeUrl = encodeURIComponent(tempUrl)
      } catch(e) {
        logInfo.completeUrl = logInfo.completeUrl
      }
    }
    if (logInfo.simpleUrl) {
      try {
        const pathName = decodeURIComponent(logInfo.simpleUrl).replace(reg, "")
        const urlArray = decodeURIComponent(logInfo.simpleUrl).match(reg)[0].split(".")
        const len = urlArray.length
        const tempUrl = urlArray[0] + "**" + urlArray[len - 1] + pathName
        logInfo.simpleUrl = encodeURIComponent(tempUrl)
      } catch(e) {
        logInfo.simpleUrl = logInfo.simpleUrl
      }
    } 
    if (logInfo.httpUrl) {
      try {
        const pathName = decodeURIComponent(Utils.b64DecodeUnicode(logInfo.httpUrl)).replace(reg, "")
        const urlArray = decodeURIComponent(Utils.b64DecodeUnicode(logInfo.httpUrl)).match(reg)[0].split(".")
        const len = urlArray.length
        const tempUrl = urlArray[0] + "**" + urlArray[len - 1] + pathName
        logInfo.httpUrl = Utils.b64DecodeUnicode(encodeURIComponent(tempUrl))
      } catch(e) {
        logInfo.httpUrl = logInfo.httpUrl
      }
    }
    if (logInfo.simpleHttpUrl) {
      try {
        const pathName = decodeURIComponent(logInfo.simpleHttpUrl).replace(reg, "")
        const urlArray = decodeURIComponent(logInfo.simpleHttpUrl).match(reg)[0].split(".")
        const len = urlArray.length
        const tempUrl = urlArray[0] + "**" + urlArray[len - 1] + pathName
        logInfo.simpleHttpUrl = encodeURIComponent(tempUrl)
      } catch(e) {
        logInfo.simpleHttpUrl = logInfo.simpleHttpUrl
      }
    }
    if (logInfo.sourceUrl) {
      try {
        const pathName = decodeURIComponent(Utils.b64DecodeUnicode(logInfo.sourceUrl)).replace(reg, "")
        const urlArray = decodeURIComponent(Utils.b64DecodeUnicode(logInfo.sourceUrl)).match(reg)[0].split(".")
        const len = urlArray.length
        const tempUrl = urlArray[0] + "**" + urlArray[len - 1] + pathName
        logInfo.sourceUrl = Utils.b64DecodeUnicode(encodeURIComponent(tempUrl))
      } catch(e) {
        logInfo.sourceUrl = logInfo.sourceUrl
      }
    }
  }
  /**
   * 接受并分类处理上传的拓展日志
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async uploadExtendLog(ctx) {
    let param = {}
    if (typeof ctx.request.body !== 'object') {
      param = JSON.parse(ctx.request.body)
    } else {
      param = ctx.request.body
    }
    ExtendBehaviorInfoModel.createExtendBehaviorInfo(param)
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('创建信息成功')
  }

  /**
   * 更新数据库表名
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async updateTableName() {
    BehaviorInfoModel.updateTableName()
    CustomerPVModel.updateTableName()
    ExtendBehaviorInfoModel.updateTableName()
    HttpErrorInfoModel.updateTableName()
    HttpLogInfoModel.updateTableName()
    JavascriptErrorInfoModel.updateTableName()
    LoadPageInfoModel.updateTableName()
    ResourceLoadInfoModel.updateTableName()
    ScreenShotInfoModel.updateTableName()
    VideosInfoModel.updateTableName()
  }

  /**
   * 根据查询参数，查询出该用户所有的行为记录
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async searchBehaviorsRecord(ctx) {
    const param = JSON.parse(ctx.request.body)
    param.userId = Utils.md5Encrypt(param.searchValue)
    param.happenTimeScope = new Date(Utils.addDays(0 - param.timeScope) + " 00:00:00").getTime()
    param.happenTimeScopeEnd = new Date(Utils.addDays(0 - param.timeScope + 1) + " 00:00:00").getTime()
    let customerKeyList = []
    let result1 = []
    let result2 = []
    let result3 = []
    let result4 = []
    let result5 = []
    let result6 = []
    let result7 = []
    let result8 = []
    let result = []
    let startDateTime = new Date().getTime()
    // 查询当前用户的customerKey列表
    await CustomerPVModel.getCustomerKeyByUserId(param).then((res) => {
      res.forEach((customerKeyInfo) => {
        if (customerKeyInfo.customerKey, customerKeyInfo.customerKey.length > 10) {
          customerKeyList.push(customerKeyInfo.customerKey)
        }
      })
      let currentDateTime = new Date().getTime()
      console.log("customerKey获取时间：", currentDateTime - startDateTime)
      startDateTime = currentDateTime
    })
    let customerKeySql = ""
    let webMonitorIdSql =  " 1=1 " // " webMonitorId='" + param.webMonitorId + "' "
    let happenTimeSql = " 1=1 " // " happenTime>" + param.happenTimeScope + " and happenTime<=" + param.happenTimeScopeEnd + " "
    let userIdSql = " userId='" + Utils.md5Encrypt(Utils.b64DecodeUnicode(param.searchValue)) + "' "
    let base64UserIdSql = " userId='" + Utils.md5Encrypt(param.searchValue) + "' "
    if (customerKeyList.length) {
      customerKeyList.forEach((customerKey, index) => {
        if (index === customerKeyList.length -1) {
          customerKeySql += " customerKey='" + customerKey + "' "
        } else {
          customerKeySql += " customerKey='" + customerKey + "' or "
        }
      })
      customerKeySql = " (" + customerKeySql + ") "
    } else {
      // 如果userId查不到，则用customerKey来进行查询
      // 前提：必须是自己的项目，如果不是则不能查询
      let customerKey = ""
      const selfProject = await ProjectModel.getProjectByUserAndPName(param.email, param.webMonitorId)
      if (selfProject.length > 0) {
        customerKey = Utils.b64DecodeUnicode(param.searchValue)
      } else {
        customerKey = "111111"
      }
      customerKeySql += " customerKey='" + customerKey + "' "
    }
    await BehaviorInfoModel.getBehaviorsByUser(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      result1 = res
    })
    await CustomerPVModel.getBehaviorsByUser(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      result2 = res
    })
    await JavascriptErrorInfoModel.getBehaviorsByUser(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      result3 = res
    })
    await ScreenShotInfoModel.getBehaviorsByUser(webMonitorIdSql, happenTimeSql, base64UserIdSql, param).then((res) => {
      result4 = res
    })
    await HttpLogInfoModel.getHttpLogsByUser(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      result5 = res
    })
    await ExtendBehaviorInfoModel.getExtendBehaviorInfoByUserId(happenTimeSql, userIdSql, param).then((res) => {
      for (let i = 0; i < res.length; i ++) {
        res[i].happenTime = new Date(res[i].createdAt).getTime()
      }
      result6 = res
    })
    await ResourceLoadInfoModel.getResourceLoadInfoByUserId(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      result7 = res
    })
    await HttpErrorInfoModel.getHttpErrorsByUser(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      result8 = res
    })

    result = result.concat(result1, result2, result3, result5, result6, result7, result8)
    result4.forEach((item) => {
      item.screenInfo = (item.screenInfo || "").toString()
      result.push(item)
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('创建信息成功', {behaviorList: result})
  }

  /**
   * 根据userId，查询出该用户详细信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async searchCustomerInfo(ctx) {
    
    const param = JSON.parse(ctx.request.body)
    param.userId = Utils.md5Encrypt(param.searchValue)
    param.happenTimeScope = new Date(Utils.addDays(0 - param.timeScope) + " 00:00:00").getTime()
    param.happenTimeScopeEnd = new Date(Utils.addDays(0 - param.timeScope + 1) + " 00:00:00").getTime()
    let customerKeyList = []
    let pvCountList = null
    let pvChartList = null
    let loadPageTimeList = null
    let ipPath = ""
    let cusDetail = null
    let startDateTime = new Date().getTime()
    let customerKey = ""
    // 查询当前用户的customerKey列表
    await CustomerPVModel.getCustomerKeyByUserId(param).then((res) => {
      res.forEach((customerKeyInfo) => {
        if (customerKeyInfo.customerKey && customerKeyInfo.customerKey.length > 10) {
          customerKeyList.push(customerKeyInfo.customerKey)
        }
      })
    })
    let customerKeySql = ""
    let webMonitorIdSql = " 1=1 "
    let happenTimeSql = " 1=1 " // " happenTime>" + param.happenTimeScope + " and happenTime<=" + param.happenTimeScopeEnd + " "
    if (customerKeyList.length) {
      customerKeyList.forEach((customerKey, index) => {
        if (index === customerKeyList.length -1) {
          customerKeySql += " customerKey='" + customerKey + "' "
        } else {
          customerKeySql += " customerKey='" + customerKey + "' or "
        }
      })
      customerKeySql = " (" + customerKeySql + ") "
    } else {
      // 如果userId查不到，则用customerKey来进行查询
      // 前提：必须是自己的项目，如果不是则不能查询
      const selfProject = await ProjectModel.getProjectByUserAndPName(param.email, param.webMonitorId)
      if (selfProject.length > 0) {
        customerKey = Utils.b64DecodeUnicode(param.searchValue)
      } else {
        customerKey = "111111"
      }
      customerKeySql += " customerKey='" + customerKey + "' "
    }
    if (customerKey === "111111") {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('抱歉，你没有查看权限', null)
      return
    }
    await CustomerPVModel.calculatePvCountByCustomerKeyForMonth(customerKeySql).then((res) => {
      pvChartList = Utils.handleDateResult(res)
    })
    await CustomerPVModel.getCustomerPVDetailByCustomerKey(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      cusDetail = res[0] || {}
    })
    await CustomerPVModel.getPVsByCustomerKey(webMonitorIdSql, customerKeySql, happenTimeSql, param).then((res) => {
      pvCountList = res
    })
    await LoadPageInfoModel.getPageLoadTimeByCustomerKey(webMonitorIdSql, customerKeySql, happenTimeSql, param).then(async (res) => {
      loadPageTimeList = res
    })
    // 获取浏览器信息
    await LoadPageInfoModel.getLoadPageInfoByCustomerKey(webMonitorIdSql, customerKeySql, param).then((res) => {
      res.forEach((item) => {
        if (item.browserInfo) {
          cusDetail["browserInfo"] = item.browserInfo
        }   
      })
    })
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('创建信息成功', {pvCountList, loadPageTimeList, cusDetail, pvChartList})
  }
  /**
   * 定时计算每小时的pv量，uv量，js错误量，http错误量， resource错误量
   */
  static async calculateCountByHour(index) {
    await fetch("http://www.webfunny.cn/server/monitorVersion")
          .then( res => res.text())
          .then( body => {
            const result = JSON.parse(body)
            global.web_monitor_version = result.data
            console.log("获取最新版本号", global.web_monitor_version)
          });
    log.printInfo("【开始执行计算每小时的pv量，uv量，js错误量，http错误量， resource错误量...")      
    Common.calculateCountByHourForDetailHour(index)
  }
  static async calculateCountByHourForDetailHour(hourIndex) {
    const lastHourTime = new Date().getTime() - hourIndex * 3600 * 1000
    const lastHour = new Date(lastHourTime).Format("yyyy-MM-dd hh") + ":00:00"
    const hour = new Date(lastHourTime + 3600 * 1000).Format("yyyy-MM-dd hh") + ":00:00"
    const sevenDayHour = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000 - hourIndex * 3600 * 1000).Format("MM-dd hh")
    log.printInfo(" 执行时间： " + lastHour + ", " + hour)
    const useHour = lastHour.substring(5, 13)
    const infoCountByHourInfo = {
      uploadType: "",
      webMonitorId: "",
      hourName: "",
      hourCount: ""
    }
    const { accountInfo, warningSetting } = AccountConfig
    const { sourceEmail, sourcePassword, targetEmail } = accountInfo
    const projectList = await ProjectModel.getAllProjectList();
    for (let i = 0; i < projectList.length; i ++) {
      let jsErrorWarningMsg = ""
      let consoleErrorWarningMsg = ""
      let resourceErrorWarningMsg = ""
      let httpErrorWarningMsg = ""
      const webMonitorId = projectList[i].webMonitorId
      infoCountByHourInfo.webMonitorId = webMonitorId
      infoCountByHourInfo.hourName = useHour
      //========================PVUV相关==========================//
      // 计算UV量
      await CustomerPVModel.calculateUvCountByHour(webMonitorId, lastHour, hour).then( async(uvData) => {
        infoCountByHourInfo.uploadType = "uv"
        infoCountByHourInfo.hourCount = uvData[0].count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, "uv")
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }
      })
      // 计算PV量
      await CustomerPVModel.calculatePvCountByHour(webMonitorId, lastHour, hour).then( async(pvData) => {
        infoCountByHourInfo.uploadType = "pv"
        infoCountByHourInfo.hourCount = pvData[0].count
        // 如果数据为0，需要发送email警报
        // if (infoCountByHourInfo.hourCount == 0) {
        //   Utils.sendEmail()
        // }
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, "pv")
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }
      })
      // 计算新用户量
      await CustomerPVModel.calculateNewCustomerCountByHour(webMonitorId, lastHour, hour).then( async(newCustomerData) => {
        infoCountByHourInfo.uploadType = UPLOAD_TYPE.NEW_CUSTOMER
        infoCountByHourInfo.hourCount = newCustomerData[0].count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, UPLOAD_TYPE.NEW_CUSTOMER)
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }
      })
      // 计算用户安装频次，清理缓存后也算重新安装
      await CustomerPVModel.calculateInstallCountByHour(webMonitorId, lastHour, hour).then( async(count) => {
        infoCountByHourInfo.uploadType = UPLOAD_TYPE.INSTALL_COUNT
        infoCountByHourInfo.hourCount = count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, UPLOAD_TYPE.INSTALL_COUNT)
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }
      })
      //========================PVUV相关==========================//

      //========================js错误相关==========================//
      // 计算js每小时的报错量 on_error
      await JavascriptErrorInfoModel.calculateJsErrorCountByHour(webMonitorId, lastHour, hour).then( async(data) => {
        infoCountByHourInfo.uploadType = UPLOAD_TYPE.ON_ERROR
        infoCountByHourInfo.hourCount = data[0].count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, UPLOAD_TYPE.ON_ERROR)
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }

        const sevenResult = await InfoCountByHourModel.getInfoCountByHourDetailByHourName(sevenDayHour, webMonitorId, UPLOAD_TYPE.ON_ERROR)
        const { minJsErrorCount, jsErrorDividedBySevenDayAgo } = warningSetting
        const todayCount = infoCountByHourInfo.hourCount * 1
        const sevenDayAgoCount = sevenResult[0].hourCount * 1
        if (todayCount > 0 && todayCount > sevenDayAgoCount && todayCount >= minJsErrorCount && (jsErrorDividedBySevenDayAgo == 0 || todayCount / sevenDayAgoCount >= jsErrorDividedBySevenDayAgo)) {
          let sevenDayAgoMsg = ""
          if (sevenDayAgoCount > 0) {
            sevenDayAgoMsg = "是上周同一时间的 " + (todayCount / sevenDayAgoCount).toFixed(2) + " 倍"
          }
          jsErrorWarningMsg = useHour + "时，JS错误量达到 " + todayCount + " 个；" + sevenDayAgoMsg
        }
      })
      // 计算js每小时的报错量 console_error
      await JavascriptErrorInfoModel.calculateConsoleErrorCountByHour(webMonitorId, lastHour, hour).then( async(data) => {
        infoCountByHourInfo.uploadType = UPLOAD_TYPE.CONSOLE_ERROR
        infoCountByHourInfo.hourCount = data[0].count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, UPLOAD_TYPE.CONSOLE_ERROR)
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }

        const sevenResult = await InfoCountByHourModel.getInfoCountByHourDetailByHourName(sevenDayHour, webMonitorId, UPLOAD_TYPE.CONSOLE_ERROR)
        const { minConsoleErrorCount, consoleErrorDividedBySevenDayAgo } = warningSetting
        const todayCount = infoCountByHourInfo.hourCount * 1
        const sevenDayAgoCount = sevenResult[0].hourCount * 1
        if (todayCount > 0 && todayCount > sevenDayAgoCount && todayCount >= minConsoleErrorCount && (consoleErrorDividedBySevenDayAgo == 0 || todayCount / sevenDayAgoCount >= consoleErrorDividedBySevenDayAgo)) {
          let sevenDayAgoMsg = ""
          if (sevenDayAgoCount > 0) {
            sevenDayAgoMsg = "是上周同一时间的 " + (todayCount / sevenDayAgoCount).toFixed(2) + " 倍"
          }
          consoleErrorWarningMsg = useHour + "时，自定义错误量达到 " + todayCount + " 个；" + sevenDayAgoMsg
        }
      })
      //========================js错误相关==========================//

      //========================静态资源错误相关==========================//
      // 计算静态资源每小时的报错量
      await ResourceLoadInfoModel.calculateResourceErrorCountByHour(webMonitorId, lastHour, hour).then( async(data) => {
        infoCountByHourInfo.uploadType = UPLOAD_TYPE.RESOURCE_ERROR
        infoCountByHourInfo.hourCount = data[0].count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, UPLOAD_TYPE.RESOURCE_ERROR)
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }

        const sevenResult = await InfoCountByHourModel.getInfoCountByHourDetailByHourName(sevenDayHour, webMonitorId, UPLOAD_TYPE.RESOURCE_ERROR)
        const { minResourceErrorCount, resourceErrorDividedBySevenDayAgo } = warningSetting
        const todayCount = infoCountByHourInfo.hourCount * 1
        const sevenDayAgoCount = sevenResult[0].hourCount * 1
        if (todayCount > 0 && todayCount > sevenDayAgoCount && todayCount >= minResourceErrorCount && (resourceErrorDividedBySevenDayAgo == 0 || todayCount / sevenDayAgoCount >= resourceErrorDividedBySevenDayAgo)) {
          let sevenDayAgoMsg = ""
          if (sevenDayAgoCount > 0) {
            sevenDayAgoMsg = "是上周同一时间的 " + (todayCount / sevenDayAgoCount).toFixed(2) + " 倍"
          }
          resourceErrorWarningMsg = useHour + "时，静态资源错误量达到 " + todayCount + " 个；" + sevenDayAgoMsg
        }
      })
      //========================静态资源错误相关==========================//

      //========================接口请求错误相关==========================//
      // 接口请求每小时的报错量
      await HttpErrorInfoModel.calculateHttpErrorCountByHour(webMonitorId, lastHour, hour).then( async(data) => {
        infoCountByHourInfo.uploadType = UPLOAD_TYPE.HTTP_ERROR
        infoCountByHourInfo.hourCount = data[0].count
        const result = await InfoCountByHourModel.getInfoCountByIdByHourName(useHour, webMonitorId, UPLOAD_TYPE.HTTP_ERROR)
        if (result.length <= 0) {
          await InfoCountByHourModel.createInfoCountByHour(infoCountByHourInfo)
        } else {
          const id = result[0].id
          await InfoCountByHourModel.updateInfoCountByHour(id, infoCountByHourInfo)
        }

        const sevenResult = await InfoCountByHourModel.getInfoCountByHourDetailByHourName(sevenDayHour, webMonitorId, UPLOAD_TYPE.HTTP_ERROR)
        const { minHttpErrorCount, HttpErrorDividedBySevenDayAgo } = warningSetting
        const todayCount = infoCountByHourInfo.hourCount * 1
        const sevenDayAgoCount = sevenResult[0].hourCount * 1
        if (todayCount > sevenDayAgoCount && todayCount >= minHttpErrorCount && todayCount / sevenDayAgoCount >= HttpErrorDividedBySevenDayAgo) {
          let sevenDayAgoMsg = ""
          if (sevenDayAgoCount > 0) {
            sevenDayAgoMsg = "是上周同一时间的 " + (todayCount / sevenDayAgoCount).toFixed(2) + " 倍"
          }
          httpErrorWarningMsg = useHour + "时，接口请求错误量达到 " + todayCount + " 个；" + sevenDayAgoMsg
        }
      })
      
      const warningMsgKey = webMonitorId + "warningMsg"
      // console.log("=====================", warningMsgKey)
      // console.log(jsErrorWarningMsg, consoleErrorWarningMsg, resourceErrorWarningMsg, httpErrorWarningMsg)
      global.monitorInfo[warningMsgKey] = {jsErrorWarningMsg, consoleErrorWarningMsg, resourceErrorWarningMsg, httpErrorWarningMsg}
      if (jsErrorWarningMsg || consoleErrorWarningMsg || resourceErrorWarningMsg || httpErrorWarningMsg) {
        const projectResult = await ProjectModel.getProjectByWebMonitorId(webMonitorId)
        const projectName = projectResult[0].projectName
        // console.log(projectResult, warningMsgKey, global.monitorInfo[warningMsgKey])
        // return
        const jsWarningName = jsErrorWarningMsg ? "JS错误报警：" : ""
        const consoleWarningName = consoleErrorWarningMsg ? "自定义错误报警：" : ""
        const resourceWarningName = resourceErrorWarningMsg ? "静态资源错误报警：" : ""
        const httpWarningName = httpErrorWarningMsg ? "接口请求错误报警：" : ""
        const html = `<p><b>项目名称：</b>${projectName}</p><p><b>${jsWarningName}</b>${jsErrorWarningMsg}</p><p><b>${consoleWarningName}</b>${consoleErrorWarningMsg}</p><p><b>${resourceWarningName}</b>${resourceErrorWarningMsg}</p><p><b>${httpWarningName}</b>${httpErrorWarningMsg}</p><p>请及时处理！</p>`
        Utils.sendEmailFromCustomer(sourceEmail, sourcePassword, "错误警报！", html, targetEmail)
      }
      log.printInfo("【计算每小时的pv量，uv量，js错误量，http错误量， resource错误量结束】")
      //========================接口请求错误相关==========================//
    }
  }


  /**
   * 定时计算每天的pv量，uv量，js错误量，http错误量，resource错误量
   */
  static async calculateCountByDay(dayIndex) {
    log.printInfo("【即将开始pv量，uv量，js错误量，http错误量，resource错误量的计算...")
    Common.calculateCountByDayForDays(dayIndex)
    // setTimeout(async () => {
    //   Common.calculateCountByDayForDays()
    // }, 20 * 1000)
    // Common.calculateCountByDayForDays(0)
    // setInterval(async () => {
    //   Common.calculateCountByDayForDays(0)
    //   setTimeout(() => {
    //     Common.calculateCountByDayForDays(-1)
    //   }, 5 * 60 * 1000)
    // }, 60 * 60 * 1000)
  }
  static async calculateCountByDayForDays(index) {
    const useDay = Utils.addDays(index)
    const infoCountByDayInfo = {
      uploadType: "",
      webMonitorId: "",
      dayName: "",
      dayCount: ""
    }
    const projectList = await ProjectModel.getAllProjectList();
    for (let i = 0; i < projectList.length; i ++) {
      const webMonitorId = projectList[i].webMonitorId
      infoCountByDayInfo.webMonitorId = webMonitorId
      infoCountByDayInfo.dayName = useDay
      //========================js错误相关==========================//
      // 计算js每天的报错量 on_error
      await JavascriptErrorInfoModel.calculateJsErrorCountByDay(webMonitorId, useDay).then( async(data) => {
        infoCountByDayInfo.uploadType = UPLOAD_TYPE.ON_ERROR
        infoCountByDayInfo.dayCount = data[0].count
        const result = await InfoCountByDayModel.getInfoCountByDayDetailByDayName(useDay, webMonitorId, UPLOAD_TYPE.ON_ERROR)
        if (result.length <= 0) {
          await InfoCountByDayModel.createInfoCountByDay(infoCountByDayInfo)
        } else {
          const id = result[0].id
          await InfoCountByDayModel.updateInfoCountByDay(id, infoCountByDayInfo)
        }
      })
      // 计算js每小时的报错量 console_error
      await JavascriptErrorInfoModel.calculateConsoleErrorCountByDay(webMonitorId, useDay).then( async(data) => {
        infoCountByDayInfo.uploadType = UPLOAD_TYPE.CONSOLE_ERROR
        infoCountByDayInfo.dayCount = data[0].count
        const result = await InfoCountByDayModel.getInfoCountByDayDetailByDayName(useDay, webMonitorId, UPLOAD_TYPE.CONSOLE_ERROR)
        if (result.length <= 0) {
          await InfoCountByDayModel.createInfoCountByDay(infoCountByDayInfo)
        } else {
          const id = result[0].id
          await InfoCountByDayModel.updateInfoCountByDay(id, infoCountByDayInfo)
        }
      })
      //========================js错误相关==========================//

      //========================接口错误相关==========================//
      // 计算接口每天的报错量
      await HttpErrorInfoModel.calculateHttpErrorCountByDay(webMonitorId, useDay).then( async(data) => {
        infoCountByDayInfo.uploadType = UPLOAD_TYPE.HTTP_ERROR
        infoCountByDayInfo.dayCount = data[0].count
        const result = await InfoCountByDayModel.getInfoCountByDayDetailByDayName(useDay, webMonitorId, UPLOAD_TYPE.HTTP_ERROR)
        if (result.length <= 0) {
          await InfoCountByDayModel.createInfoCountByDay(infoCountByDayInfo)
        } else {
          const id = result[0].id
          await InfoCountByDayModel.updateInfoCountByDay(id, infoCountByDayInfo)
        }
      })
      //========================接口错误相关==========================//

      //========================静态资源错误相关==========================//
      // 计算静态资源每天的报错量 
      await ResourceLoadInfoModel.calculateResourceErrorCountByDay(webMonitorId, useDay).then( async(data) => {
        infoCountByDayInfo.uploadType = UPLOAD_TYPE.RESOURCE_ERROR
        infoCountByDayInfo.dayCount = data[0].count
        const result = await InfoCountByDayModel.getInfoCountByDayDetailByDayName(useDay, webMonitorId, UPLOAD_TYPE.RESOURCE_ERROR)
        if (result.length <= 0) {
          await InfoCountByDayModel.createInfoCountByDay(infoCountByDayInfo)
        } else {
          const id = result[0].id
          await InfoCountByDayModel.updateInfoCountByDay(id, infoCountByDayInfo)
        }
      })
      log.printInfo("pv量，uv量，js错误量，http错误量，resource错误量的计算结束】")
      //========================静态资源错误相关==========================//
    }

  }

  /**
   * 获取所有的错误影响人数
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getErrorInfo(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)

    const todayErrorInfoName = "todayErrorInfoKey--" + params.webMonitorId
    const todayErrorInfo = global.monitorInfo[todayErrorInfoName]
    const currentTime = new Date().getTime()
    if (todayErrorInfo && (currentTime - todayFlow.happenTime < 60 * 60 * 1000)) {
      ctx.response.status = 200;
      ctx.body = statusCode.SUCCESS_200('更新信息成功！', todayErrorInfo);
      return
    }
    const todayUvData = await CustomerPVModel.getUVCountForDay(params, 0);
    const jsErrorData = await JavascriptErrorInfoModel.getJsErrorUserCountToday(params.webMonitorId, 0)
    const consoleErrorData = await JavascriptErrorInfoModel.getConsoleErrorUserCountToday(params.webMonitorId, 0)
    const resourceErrorData = await ResourceLoadInfoModel.getResourceErrorUserCountToday(params.webMonitorId, 0)
    const httpErrorData = await HttpErrorInfoModel.getHttpErrorUserCountToday(params.webMonitorId, 0)
    const result = {
      todayUvCount: todayUvData[0].count, 
      jsErrorTotalCount: jsErrorData[0].count, 
      jsConsoleErrorTotalCount: consoleErrorData[0].count, 
      resourceErrorTotalCount: resourceErrorData[0].count, 
      httpErrorTotalCount: httpErrorData[0].count
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', result)
  }
  /**
   * 获取警报信息
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async getWarningMsg(ctx) {
    let req = ctx.request.body
    const params = JSON.parse(req)
    const warningMsgKey = params.webMonitorId + "warningMsg"
    console.log(warningMsgKey)
    const result = global.monitorInfo[warningMsgKey]
    console.log(global.monitorInfo)
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', result)
  }
  /**
   * 每5分钟检查一下mysql的最大错误连接数，并发送邮件报警
   */
  static async checkMysqlConnectErrors() {
    setInterval(async () => {
      const data = await CommonModel.checkMysqlConnectErrors()
      const count = data[0].count
      if (count >= 50) { // 发送警报邮件
        Utils.sendEmail("597873885@qq.com", "Mysql错误连接数报警", "Mysql错误连接数：" + count)
      }
    }, 600 * 1000)
  }
   /**
   */
  static async checkMysqlStatus(ctx) {
    const errorListData = await CommonModel.checkMysqlConnectErrors()
    const connectionData = await CommonModel.checkMysqlConnects()
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', {errorListData, connectionData})
  }
  /**
   * 立邦开关
   * @param ctx
   * @returns {Promise.<void>}
   */
  static async liBangData(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', 1)
  }


  /**
   * 启动数据删除， 只记录最近15天的数据
   */
  static async startDelete() {
    log.printInfo("【即将开始表删除程序...")
    const dateStr = Utils.addDays(-16).replace(/-/g, "")
    const tables = [
      "BehaviorInfo", "CustomerPV", "ExtendBehaviorInfo", "HttpErrorInfo",
      "HttpLogInfo", "JavascriptErrorInfo", "LoadPageInfo", "ResourceLoadInfo", 
      "ScreenShotInfo", "EmailCode", "VideosInfo"
    ]
    try {
      tables.forEach(async (tableName) => {
        log.printInfo("开始删除数据库表 " + tableName + dateStr + "...")
        await Sequelize.dropSchema(tableName + dateStr).then(() => {
          log.printInfo("成功删除数据库表 " + tableName)
        })
      })
    } catch (e) {
      log.printError("删除表操作报错", e)
    }
    log.printInfo("表删除程序结束】")
  }

  /**
   * 重启服务
   */
  static async restartServer() {
    try {
        callFile.execFile('./restart.sh', [], null, function (err, stdout, stderr) {
            log.printError(JSON.stringify(err))
            log.printError(stdout)
            log.printError(stderr)
        });
    } catch(e) {
        log.printError(e)
        log.printError(errorStr)
    }
  }

   /**
   * 获取git star数量
   * @param ctx
   * @returns {Promise.<void>}
   * {per_page: 100, page: 3}
   */
  static async gitStars(ctx) {
    let stars = 0
    const gitStarsKey = "gitStars" + new Date().Format("yyyyMMdd")
    if (global.monitorInfo[gitStarsKey]) {
      stars = global.monitorInfo[gitStarsKey]
    } else {
      await fetch("https://api.github.com/repos/a597873885/webfunny_monitor/stargazers?per_page=100&page=8")
      .then( res => res.text())
      .then( body => {
        stars = JSON.parse(body).length + 700
        global.monitorInfo[gitStarsKey] = stars
      });
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', stars)
  }

  /**
   * 推送信息配置
   * @param ctx
   * @returns {Promise.<void>}
   * {per_page: 100, page: 3}
   */
  static async pushInfo(ctx) {
    const pushInfo = {
      activeDate: "2020-01-03",
      messageList: [
        "1. 注意，1月3日之前部署的用户，第二天可能无法自动生成数据库表，请拉取最新代码, 问题已修复。"
      ],
      futureMessageList: [
        "1. 注意，1月3日之前部署的用户，第二天可能无法自动生成数据库表，请拉取最新代码, 问题已修复。",
      ]
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', pushInfo)
  }

  /**
   * 推送信息配置
   * @param ctx
   * @returns {Promise.<void>}
   * {per_page: 100, page: 3}
   */
  static async updateInfo(ctx) {
    const pushInfo = {
      delay: 10,
      activeDate: "2019-12-18",
      projectVersion: PROJECT_INFO.PROJECT_VERSION,
      updateList: [
        {
          des: "1. 增加了多时间维度，和设置功能。",
          img: "http://47.105.132.73:8000/updateImages/5.jpg"
        },
        {
          des: "2. 修复了UV统计不准确的问题。",
          img: "http://47.105.132.73:8000/updateImages/6.jpg"
        }
      ]
    }
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', pushInfo)
  }

  /**
   * 获取项目版本号
   * @param ctx
   * @returns {Promise.<void>}
   * {per_page: 100, page: 3}
   */
  static async projectVersion(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', PROJECT_INFO.PROJECT_VERSION)
  }
  /**
   * 版本信息
   * @param ctx
   * @returns {Promise.<void>}
   * {per_page: 100, page: 3}
   */
  static async monitorVersion(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', PROJECT_INFO.MONITOR_VERSION)
  }

  static async searchUserBehaviorsForExample(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', userBehaviors)
  }
  static async searchCustomerInfoForExample(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', customerInfo)
  }


  static async abortApis(ctx) {
    ctx.response.status = 200;
    ctx.body = statusCode.SUCCESS_200('success', "抱歉，你暂时没有权限访问此接口")
  }
}

module.exports = {HttpErrorInfoController,HttpLogInfoController,ScreenShotInfoController,DailyActivityController,BehaviorInfoController,ExtendBehaviorInfoController,IgnoreErrorController,InfoCountByHourController,ProjectController,LoadPageInfoController,UserController,PurchaseCodeController,ResourceLoadInfoController,VideosInfoController,EmailCodeController,CustomerPVController,JavascriptErrorInfoController,Common}