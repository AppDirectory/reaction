import { compose, withProps } from "recompose";
import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Orders, Media } from "/lib/collections";
import { Reaction } from "/client/api";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import CompletedOrder from "../components/completedOrder";


const handlers = {};

handlers.handleDisplayMedia = (item) => {
  const variantId = item.variants._id;
  const productId = item.productId;

  const variantImage = Media.findOne({
    "metadata.variantId": variantId,
    "metadata.productId": productId
  });

  if (variantImage) {
    return variantImage;
  }

  const defaultImage = Media.findOne({
    "metadata.productId": productId,
    "metadata.priority": 0
  });

  if (defaultImage) {
    return defaultImage;
  }
  return false;
}

function composer(props, onData) {
  const orderId = Reaction.Router.getQueryParam("_id");
  const orderSub = Meteor.subscribe("CompletedCartOrder", Meteor.userId(), orderId);

  if (orderSub.ready()) {
    const order = Orders.findOne({
      userId: Meteor.userId(),
      cartId: orderId
    });
    const imageSub = Meteor.subscribe("CartImages", order.items);

    const itemsByShop = _.sortBy(order.items, function (o) { return o.shopID; });
    const orderSummary = {
      quantityTotal: order.orderCount(),
      subtotal: order.orderSubTotal(),
      shipping: order.orderShipping(),
      tax: order.orderTaxes(),
      discounts: order.orderDiscounts(),
      total: order.orderTotal()
    };

    let productImages;
    if (imageSub.ready()) {
      productImages = Media.find().fetch();
    }

    onData(null, {
      items: itemsByShop,
      order,
      orderSummary,
      productImages
    });
  }
}


registerComponent("CompletedOrder", CompletedOrder, [
  withProps(handlers),
  composeWithTracker(composer)
]);

export default compose(
  withProps(handlers),
  composeWithTracker(composer)
)(CompletedOrder);