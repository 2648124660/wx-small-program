var app = getApp()
var common = require('../../utils/common.js')
var util = require('../../utils/util.js')

var id;
var that;

var unionId;
var nickName;

var page;
var size = 10;
var commentPage = 1;
var commentSize = 5;

Page({
  data:{
    lawyerInfo: '',
    lawyerAwardWinning: [],
    currentTab: 1,
    stars: [0, 1, 2, 3, 4],
    normalSrc: '../../images/9@2X.png',
    selectedSrc: '../../images/11@2X.png',
    halfSrc:'../../images/10@2X.png',
    key: 5,//评分
    count:'',
    defaultAvatar: '../../images/avatar.png',
    isRolling: false,
    CompleteQuestions: [],
    comment_list: [],
    completeCount: ''
  },
  onLoad:function(options){
    // 页面初始化 options为页面跳转所带来的参数
    id = options.id;
    that = this;
    app.func.reqGet('/lawyer/get_info/'+id,function(res) {
      that.setData({
        isRolling: true
      })
      if (res.result.comment_list) {
        for (var i=0; i<res.result.comment_list.length; i++) {
          res.result.comment_list[i].create_time = common.createTime(res.result.comment_list[i].create_time)
        }
      }
      var lawyerAwardWinning = ''
      if (res.result.award_winning) {
        lawyerAwardWinning = res.result.award_winning.split(";")
      }
      
      that.setData({
        lawyerInfo: res.result,
        lawyerAwardWinning: lawyerAwardWinning,
        count:common.numData(res.result.ViewCount)
      })
    });
  },

  onReady:function(){
    that.setData({
      completeCount: wx.getStorageSync('completeCount')
    })
    // 页面渲染完成
    page = 1

    app.func.reqPost('/lawyer/replace_question', {
      userId: id,
      page: page,
      size: size
    }, function(res) {
      that.setData({
        CompleteQuestions: res.result
      })
    })

    that._getCommentList(1)
  },

  //页面上拉
  onReachBottom: function() {
    if (that.data.currentTab == 1 && that.data.CompleteQuestions.length >= 10) {
      page++

      app.func.reqPost('/lawyer/replace_question', {
        userId: id,
        page: page,
        size: size
      }, function (res) {
        if (res.isSuc) {
          if (res.result) {

            that.setData({
              CompleteQuestions: that.data.CompleteQuestions.concat(res.result)
            })
          } else {
            page--
          }
        } else {
          page--
        }
      })
    }
    if (that.data.currentTab == 2 && that.data.comment_list.length >= 5) {
      commentPage ++
      that._getCommentList(commentPage)
    }
  },

  onShow:function(){
    // 页面显示
    
  },
  onHide:function(){
    // 页面隐藏
    
  },
  onUnload:function(){
    // 页面关闭
    
  },
  onShareAppMessage:function () {
    //分享
    return {
      title: that.data.lawyerInfo.lawyer_name+'律师的小程序',
      desc: '已解答'+that.data.lawyerInfo.CompleteOrderCount+'次，用户评价'+that.data.lawyerInfo.score+'分',
      path: '/pages/lawyerInfo/lawyerInfo?id='+id
    }
  },

  _getCommentList(commentPage) {
    // 获取评论信息
    var para = {
      userID: id,
      type: 1,
      pageSize: commentSize,
      pageIndex: commentPage
    }

    app.func.reqPost('/comment/get_comment_pager_list', para, function (res) {
      if (res.isSuc) {
        if (res.result) {
          res.result.forEach(function (val) {
            val.UserInfo.CreateDate = common.createTime1(val.UserInfo.CreateDate, 1)
          })
          that.setData({
            comment_list: that.data.comment_list.concat(res.result)
          })
        } else {
          return
        }
      }
    })
  },

  consultation: function(e) {
    var lawyerId = that.data.lawyerInfo.lawyer_id;
    var lawyerName = that.data.lawyerInfo.lawyer_name;
    // wx.navigateTo({
    //   url: '../consultation/consultation?user_id='+that.data.lawyerInfo.lawyer_id,
    // })
    wx.getStorage({
    key: 'token',
    success: function(res) {
      if (that.data.lawyerInfo.questionPrice == 0) {
        wx.navigateTo({
          url: '../consultation/consultation?user_id=' + lawyerId + '&name=' + lawyerName
        })
      } else {
        wx.navigateTo({
          url: '../consultation/consultation?user_id=' + lawyerId + '&name=' + lawyerName + '&questionPrice=' + that.data.lawyerInfo.questionPrice
        })
      }
    }, fail: function() {
            app.getUserInfo(function(userInfo, code, iv, encryptedData){
              if (userInfo){
                app.func.reqPost('/wxProgram/onLogin', {
                  code: code,
                  IV:iv,
                  encryptedData:encryptedData
                }, function(res) { 
                  if (res.isSuc) {
                    var wxInfo = JSON.parse(res.result)
                    wx.setStorageSync('openId', wxInfo.openId)
                    unionId = wxInfo.unionId;
                    nickName = wxInfo.nickName;
                    app.func.reqPost('/passport/quick_login', {
                      para: {
                        platform: 9,
                        openId: wxInfo.openId,
                        unionID: wxInfo.unionId,
                        token: '123',
                        avatar: wxInfo.avatarUrl,
                        appId: wxInfo.watermark.appid,
                        nickName: wxInfo.nickName
                      }
                    }, function(res){
                        console.log(res)
                        if (res.result) {
                          app.globalData.lawyerSayUserInfo = res.result;
                          //token缓存到本地
                          try {
                              wx.setStorageSync('token', res.result.Token)
                              wx.setStorageSync('lawyerSayUserInfo', res.result)
                          } catch (e) {    
                            console.log(e)
                          }
                          if (that.data.lawyerInfo.questionPrice == 0) {
                            wx.navigateTo({
                              url: '../consultation/consultation?user_id=' + lawyerId + '&name=' + lawyerName
                            })
                          } else{
                            wx.navigateTo({
                              url: '../consultation/consultation?user_id=' + lawyerId + '&name=' + lawyerName + '&questionPrice=' + that.data.lawyerInfo.questionPrice
                            })
                          }
                        } else {
                          wx.showModal({
                            title: '提示',
                            content: '提示：咨询前请绑定手机，律师解答后将立刻通知您。',
                            success: function(res) {
                              if (res.confirm) {
                                wx.getStorage({
                                  key: 'openId',
                                  success: function(res) {
                                    wx.navigateTo({
                                        url: '../register/register?openId=' + res.data + "&unionId=" + unionId + "&nickName=" + nickName,
                                    })
                                  } 
                                })
                              }
                            }
                          })
                        }
                    })          
                  } else {
                    common.showToast(res.message,'loading')
                  }
                })
              } else {
                common.showToast('登录授权失败','loading')
              }
            })
    } 
  })
  },

  switchTab1: function() {
    that.setData({
      currentTab: 1
    })
  },

  switchTab2: function() {
    that.setData({
      currentTab: 2
    })
  },

    //点击右边,半颗星
  selectLeft: function (e) {
    var key = e.currentTarget.dataset.key
     if (this.data.key == 0.5 && e.currentTarget.dataset.key == 0.5) {
    //只有一颗星的时候,再次点击,变为0颗
       key = 0;
    }
    this.setData({
      key: key
    })

  },
  //点击左边,整颗星
  selectRight: function (e) {
    var key = e.currentTarget.dataset.key
    this.setData({
      key: key
    }) 
  },

    //跳转到订单详情
  gotoCaseDetail: function(e) {
    var id = e.currentTarget.id;
    console.log(id)
    wx.navigateTo({
      url: '../getCaseDetail/getCaseDetail?id=' + id,
    })
  },
})